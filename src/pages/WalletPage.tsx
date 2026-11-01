import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Coins,
  ArrowUpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Gift,
  Info,
  X,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  getCoinBalance,
  topUpCoinsDemo,
  getUserTransactions,
  COIN_PACKAGES,
} from "../services/wallet";
import type { CoinPackage, Transaction } from "../types/monetization";

// ---------------------------------------------------------------------------
// Badge Simulasi — sesuai tema KomikinAja (parchment & dark navy)
// ---------------------------------------------------------------------------

const DemoBadge: React.FC = () => {
  const { t } = useLanguage();
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-surface text-primary border border-primary/20 text-xs font-bold tracking-wide">
      {t("wallet.demoBadge")}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Top-up package card
// ---------------------------------------------------------------------------

interface PackageCardProps {
  pkg: CoinPackage;
  onBuy: (pkg: CoinPackage) => void;
  buying: boolean;
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, onBuy, buying }) => {
  const { t } = useLanguage();
  const totalCoins = pkg.coinAmount + (pkg.bonusCoins || 0);

  return (
    <div
      className={`relative bg-surface rounded-xl p-5 flex flex-col justify-between border-2 transition-all ${
        pkg.popular
          ? "border-primary shadow-sm"
          : "border-primary/10 hover:border-primary/40"
      }`}
    >
      {pkg.popular && (
        <span className="absolute -top-3 right-4 px-2.5 py-0.5 bg-primary text-white text-[11px] font-bold rounded-md uppercase tracking-wider">
          {t("wallet.packagePopular")}
        </span>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Coins size={22} className="text-primary" aria-hidden="true" />
          </div>
          <div className="text-left">
            <p className="font-bold text-primary text-base leading-tight">
              {pkg.name}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {pkg.coinAmount} koin
            </p>
          </div>
        </div>

        {pkg.bonusCoins && (
          <div className="flex items-center gap-1.5 bg-background border border-primary/15 rounded-md px-2.5 py-1 text-left w-fit">
            <Gift size={12} className="text-primary" aria-hidden="true" />
            <span className="text-xs font-bold text-primary">
              {t("wallet.bonusCoins", { bonus: pkg.bonusCoins })}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-primary/10 flex items-end justify-between">
        <div className="text-left">
          <p className="text-xs text-gray-500">{t("wallet.coinsLabel")}</p>
          <p className="text-2xl font-bold font-heading text-primary leading-tight">
            {totalCoins}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Harga</p>
          <p className="text-sm font-bold text-primary">
            Rp {pkg.priceIdr.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <button
        onClick={() => onBuy(pkg)}
        disabled={buying}
        className="mt-4 w-full py-2.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors text-sm"
      >
        {buying ? "..." : t("wallet.buyBtn")}
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Transaction item
// ---------------------------------------------------------------------------

const TxItem: React.FC<{ tx: Transaction }> = ({ tx }) => {
  const { t } = useLanguage();

  const labelMap: Record<string, string> = {
    top_up: t("wallet.txTopUp"),
    chapter_purchase: t("wallet.txUnlock"),
    author_tip: t("wallet.txTip"),
    work_support: t("wallet.txTip"),
  };

  const isIncome = tx.type === "top_up";
  const statusIcon =
    tx.status === "succeeded" ? (
      <CheckCircle2
        size={16}
        className="text-green-600 shrink-0"
        aria-hidden="true"
      />
    ) : tx.status === "failed" ? (
      <XCircle size={16} className="text-red-500 shrink-0" aria-hidden="true" />
    ) : (
      <Clock size={16} className="text-amber-600 shrink-0" aria-hidden="true" />
    );

  const date = new Date(tx.createdAt).toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div className="flex items-center gap-3 py-3 border-b border-primary/10 last:border-0 text-left">
      {statusIcon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary truncate">
          {labelMap[tx.type] || tx.type}
        </p>
        {tx.comicTitle && (
          <p className="text-xs text-gray-600 truncate">{tx.comicTitle}</p>
        )}
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      <span
        className={`font-bold text-sm whitespace-nowrap ${
          isIncome ? "text-green-700" : "text-primary"
        }`}
      >
        {isIncome ? "+" : "−"}
        {tx.coinAmount} {t("wallet.coinsLabel")}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Confirm modal for top-up
// ---------------------------------------------------------------------------

interface ConfirmTopUpProps {
  pkg: CoinPackage;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  success: boolean;
  successMsg: string;
}

const ConfirmTopUp: React.FC<ConfirmTopUpProps> = ({
  pkg,
  onConfirm,
  onCancel,
  loading,
  success,
  successMsg,
}) => {
  const { t } = useLanguage();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={t("wallet.topUp")}
    >
      <div className="bg-background border border-primary/20 rounded-xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4 text-left">
        {success ? (
          <>
            <div className="flex flex-col items-center gap-3 text-center py-4">
              <CheckCircle2
                size={44}
                className="text-green-600"
                aria-hidden="true"
              />
              <p className="font-bold text-primary text-base">{successMsg}</p>
              <DemoBadge />
            </div>
            <button
              onClick={onCancel}
              className="w-full py-2.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover transition-colors text-sm"
            >
              {t("common.back")}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Coins size={20} className="text-primary" aria-hidden="true" />
                <h2 className="font-bold font-heading text-lg text-primary">
                  {t("wallet.topUp")}
                </h2>
              </div>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Tutup"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="bg-surface rounded-lg p-3 text-sm">
              <p className="font-semibold text-primary">{pkg.name}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Jumlah:{" "}
                <b>
                  {pkg.coinAmount + (pkg.bonusCoins || 0)}{" "}
                  {t("wallet.coinsLabel")}
                </b>
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Simulasi Harga: <b>Rp {pkg.priceIdr.toLocaleString("id-ID")}</b>
              </p>
            </div>

            <div className="bg-surface/70 border border-primary/15 rounded-lg p-3 flex gap-2 items-start">
              <Info
                size={15}
                className="text-primary shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-xs text-gray-700 leading-relaxed">
                {t("wallet.demoNotice")}
              </p>
            </div>

            <div className="flex gap-3 mt-1">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-2.5 border-2 border-primary/30 text-primary font-semibold rounded-md hover:bg-primary/5 transition-colors text-sm"
              >
                {t("detail.cancel")}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover disabled:opacity-60 transition-colors text-sm"
              >
                {loading ? "..." : t("wallet.buyBtn")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export const WalletPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  // Top-up flow
  const [pendingPkg, setPendingPkg] = useState<CoinPackage | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getCoinBalance(user.id).then((b) => {
      if (!cancelled) {
        setBalance(b);
        setBalanceLoading(false);
      }
    });
    getUserTransactions(user.id).then((txs) => {
      if (!cancelled) {
        setTransactions(txs);
        setTxLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleConfirmTopUp = async () => {
    if (!user || !pendingPkg) return;
    setBuyLoading(true);
    const result = await topUpCoinsDemo(user.id, pendingPkg);
    setBuyLoading(false);
    if (result.success) {
      setBalance(result.newBalance);
      setBuySuccess(true);
      setSuccessMsg(
        t("wallet.topUpSuccess", {
          coins: pendingPkg.coinAmount + (pendingPkg.bonusCoins || 0),
        }),
      );
      getUserTransactions(user.id).then((txs) => setTransactions(txs));
    }
  };

  const handleCloseModal = () => {
    setPendingPkg(null);
    setBuySuccess(false);
    setBuyLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Page header */}
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-heading text-primary">
              {t("wallet.title")}
            </h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-gray-600">{t("wallet.demoNotice")}</p>
        </div>

        {/* Balance card — styled like Home hero container */}
        <div className="bg-primary text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm text-left">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Coins size={30} className="text-amber-300" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">
                {t("wallet.balance")}
              </p>
              {balanceLoading ? (
                <div className="h-9 w-32 bg-white/20 rounded-md animate-pulse" />
              ) : (
                <p className="text-3xl sm:text-4xl font-bold font-heading leading-none">
                  {balance.toLocaleString()}
                  <span className="text-base font-normal ml-2 text-gray-300">
                    {t("wallet.coinsLabel")}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-300 flex items-center gap-1.5 self-end sm:self-center bg-white/5 px-3 py-1.5 rounded-md border border-white/10">
            <Lock size={13} aria-hidden="true" />
            <span>Simulasi UX</span>
          </div>
        </div>

        {/* Top-up section */}
        <section className="text-left">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpCircle
              size={20}
              className="text-primary"
              aria-hidden="true"
            />
            <h2 className="text-xl font-bold font-heading text-primary">
              {t("wallet.topUp")}
            </h2>
          </div>
          <p className="text-sm text-gray-600 mb-5">{t("wallet.topUpDesc")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COIN_PACKAGES.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onBuy={(p) => {
                  setPendingPkg(p);
                  setBuySuccess(false);
                }}
                buying={buyLoading && pendingPkg?.id === pkg.id}
              />
            ))}
          </div>
        </section>

        {/* Transaction history */}
        <section className="text-left">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={20} className="text-primary" aria-hidden="true" />
            <h2 className="text-xl font-bold font-heading text-primary">
              {t("wallet.history")}
            </h2>
          </div>
          <div className="bg-surface rounded-xl p-5 border border-primary/10">
            {txLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-gray-300/50 rounded-md animate-pulse"
                  />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                {t("wallet.historyEmpty")}
              </p>
            ) : (
              <div className="flex flex-col">
                {transactions.slice(0, 20).map((tx) => (
                  <TxItem key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Notice */}
        <div className="bg-surface/70 border border-primary/15 rounded-xl p-4 flex gap-3 text-left">
          <Info
            size={18}
            className="text-primary shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="text-xs text-gray-700 leading-relaxed">
            <p className="font-bold text-primary mb-0.5">
              {t("wallet.payoutNotice")}
            </p>
            <p>{t("wallet.demoNotice")}</p>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="text-sm text-primary font-semibold hover:underline"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </main>

      <Footer />

      {/* Top-up modal */}
      {pendingPkg && (
        <ConfirmTopUp
          pkg={pendingPkg}
          onConfirm={handleConfirmTopUp}
          onCancel={handleCloseModal}
          loading={buyLoading}
          success={buySuccess}
          successMsg={successMsg}
        />
      )}
    </div>
  );
};
