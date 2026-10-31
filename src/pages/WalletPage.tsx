import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  ArrowUpCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  Gift,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getCoinBalance,
  topUpCoinsDemo,
  getUserTransactions,
  COIN_PACKAGES,
} from '../services/wallet';
import type { CoinPackage, Transaction } from '../types/monetization';

// ---------------------------------------------------------------------------
// DEMO badge — dipakai di semua bagian halaman ini sesuai PRD §5.4
// ---------------------------------------------------------------------------

const DemoBadge: React.FC = () => {
  const { t } = useLanguage();
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 border border-amber-400 text-amber-700 text-[11px] font-bold tracking-wider">
      <AlertTriangle size={12} aria-hidden="true" />
      {t('wallet.demoBadge')}
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
      className={`relative bg-surface rounded-2xl p-5 flex flex-col gap-3 border-2 transition-all ${
        pkg.popular ? 'border-primary shadow-lg scale-[1.02]' : 'border-primary/10 hover:border-primary/30'
      }`}
    >
      {pkg.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-white text-[11px] font-bold rounded-full">
          {t('wallet.packagePopular')}
        </span>
      )}

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Coins size={24} className="text-amber-600" aria-hidden="true" />
        </div>
        <div>
          <p className="font-bold text-primary">{pkg.name}</p>
          <p className="text-xs text-gray-500">{pkg.coinAmount} koin{pkg.bonusCoins ? ` + ${pkg.bonusCoins} bonus` : ''}</p>
        </div>
      </div>

      {pkg.bonusCoins && (
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
          <Gift size={13} className="text-green-600" aria-hidden="true" />
          <span className="text-xs font-bold text-green-700">
            {t('wallet.bonusCoins', { bonus: pkg.bonusCoins })}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <div>
          <p className="text-2xl font-bold text-primary">{totalCoins}</p>
          <p className="text-xs text-gray-500">{t('wallet.coinsLabel')}</p>
        </div>
        <p className="text-sm font-semibold text-gray-600">
          Rp {pkg.priceIdr.toLocaleString('id-ID')}
        </p>
      </div>

      <button
        onClick={() => onBuy(pkg)}
        disabled={buying}
        className="w-full py-2.5 bg-primary text-white font-bold rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
      >
        {buying ? '...' : t('wallet.buyBtn')}
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
    top_up: t('wallet.txTopUp'),
    chapter_purchase: t('wallet.txUnlock'),
    author_tip: t('wallet.txTip'),
    work_support: t('wallet.txTip'),
  };

  const isIncome = tx.type === 'top_up';
  const statusIcon =
    tx.status === 'succeeded' ? (
      <CheckCircle2 size={15} className="text-green-500 shrink-0" aria-hidden="true" />
    ) : tx.status === 'failed' ? (
      <XCircle size={15} className="text-red-500 shrink-0" aria-hidden="true" />
    ) : (
      <Clock size={15} className="text-amber-500 shrink-0" aria-hidden="true" />
    );

  const date = new Date(tx.createdAt).toLocaleString('id-ID', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="flex items-center gap-3 py-3 border-b border-primary/10 last:border-0">
      {statusIcon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary truncate">{labelMap[tx.type] || tx.type}</p>
        {tx.comicTitle && (
          <p className="text-xs text-gray-500 truncate">{tx.comicTitle}</p>
        )}
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      <span
        className={`font-bold text-sm whitespace-nowrap ${
          isIncome ? 'text-green-600' : 'text-red-500'
        }`}
      >
        {isIncome ? '+' : '−'}{tx.coinAmount} {t('wallet.coinsLabel')}
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
  pkg, onConfirm, onCancel, loading, success, successMsg,
}) => {
  const { t } = useLanguage();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('wallet.topUp')}
    >
      <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
        {success ? (
          <>
            <div className="flex flex-col items-center gap-3 text-center py-4">
              <CheckCircle2 size={48} className="text-green-500" aria-hidden="true" />
              <p className="font-bold text-primary">{successMsg}</p>
              <DemoBadge />
            </div>
            <button
              onClick={onCancel}
              className="w-full py-3 bg-primary text-white font-bold rounded-full"
            >
              {t('common.back')}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <Coins size={24} className="text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="font-bold text-lg text-primary">{t('wallet.topUp')}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {pkg.name} — {pkg.coinAmount + (pkg.bonusCoins || 0)} {t('wallet.coinsLabel')}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <DemoBadge />
              <p className="text-xs text-amber-700 mt-2 leading-relaxed">
                {t('wallet.demoNotice')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-2.5 border-2 border-gray-300 text-gray-700 font-bold rounded-full hover:bg-gray-100 transition-colors text-sm"
              >
                {t('detail.cancel')}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-2.5 bg-primary text-white font-bold rounded-full hover:bg-primary/90 disabled:opacity-60 transition-colors text-sm"
              >
                {loading ? '...' : t('wallet.buyBtn')}
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
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getCoinBalance(user.id).then(b => {
      if (!cancelled) { setBalance(b); setBalanceLoading(false); }
    });
    getUserTransactions(user.id).then(txs => {
      if (!cancelled) { setTransactions(txs); setTxLoading(false); }
    });
    return () => { cancelled = true; };
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
        t('wallet.topUpSuccess', { coins: pendingPkg.coinAmount + (pendingPkg.bonusCoins || 0) }),
      );
      // Reload transactions
      getUserTransactions(user.id).then(txs => setTransactions(txs));
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

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Page header */}
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-heading text-primary">{t('wallet.title')}</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-gray-600">{t('wallet.demoNotice')}</p>
        </div>

        {/* Balance card */}
        <div className="bg-primary text-white rounded-3xl p-6 flex items-center gap-5 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Coins size={32} className="text-amber-300" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white/70 mb-1">{t('wallet.balance')}</p>
            {balanceLoading ? (
              <div className="h-10 w-32 bg-white/20 rounded-xl animate-pulse" />
            ) : (
              <p className="text-4xl font-bold leading-none">
                {balance.toLocaleString()}
                <span className="text-lg font-semibold ml-2 text-white/70">{t('wallet.coinsLabel')}</span>
              </p>
            )}
          </div>
          <Lock size={18} className="text-white/40 shrink-0" aria-label="Saldo demo tidak bernilai uang" />
        </div>

        {/* Top-up section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpCircle size={20} className="text-primary" aria-hidden="true" />
            <h2 className="text-lg font-bold text-primary">{t('wallet.topUp')}</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">{t('wallet.topUpDesc')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COIN_PACKAGES.map(pkg => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onBuy={p => { setPendingPkg(p); setBuySuccess(false); }}
                buying={buyLoading && pendingPkg?.id === pkg.id}
              />
            ))}
          </div>
        </section>

        {/* Transaction history */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-primary" aria-hidden="true" />
            <h2 className="text-lg font-bold text-primary">{t('wallet.history')}</h2>
          </div>
          <div className="bg-surface rounded-2xl p-5">
            {txLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">{t('wallet.historyEmpty')}</p>
            ) : (
              <div className="flex flex-col">
                {transactions.slice(0, 20).map(tx => (
                  <TxItem key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-amber-800">
            <p className="font-bold mb-1">{t('wallet.payoutNotice')}</p>
            <p className="text-xs text-amber-700">{t('wallet.demoNotice')}</p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/" className="text-sm text-primary hover:underline">
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
