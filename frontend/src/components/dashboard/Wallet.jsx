import React, { useState, useEffect } from 'react';
import { FaWallet, FaPlus, FaMinus, FaHistory } from 'react-icons/fa';
import './Wallet.css';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      // Replace with your actual API endpoints
      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetch('/api/user/wallet/balance'),
        fetch('/api/user/wallet/transactions')
      ]);

      const balanceData = await balanceResponse.json();
      const transactionsData = await transactionsResponse.json();

      if (balanceResponse.ok && transactionsResponse.ok) {
        setBalance(balanceData.balance);
        setTransactions(transactionsData);
      } else {
        throw new Error('Failed to fetch wallet data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/user/wallet/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.newBalance);
        setTransactions(prev => [data.transaction, ...prev]);
        setShowAddMoney(false);
        setAmount('');
      } else {
        throw new Error('Failed to add money');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="wallet-loading">Loading...</div>;
  }

  if (error) {
    return <div className="wallet-error">{error}</div>;
  }

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h1>My Wallet</h1>
        <button 
          className="add-money-button"
          onClick={() => setShowAddMoney(true)}
        >
          <FaPlus /> Add Money
        </button>
      </div>

      <div className="wallet-balance">
        <div className="balance-card">
          <FaWallet className="wallet-icon" />
          <div className="balance-details">
            <h2>Available Balance</h2>
            <p className="balance-amount">₹{balance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {showAddMoney && (
        <div className="add-money-modal">
          <div className="modal-content">
            <h2>Add Money to Wallet</h2>
            <form onSubmit={handleAddMoney}>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  step="1"
                  required
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="submit-button">
                  Add Money
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowAddMoney(false);
                    setAmount('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="transactions-section">
        <h2>Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="no-transactions">No transactions yet</p>
        ) : (
          <div className="transactions-list">
            {transactions.map(transaction => (
              <div 
                key={transaction._id} 
                className={`transaction-item ${transaction.type}`}
              >
                <div className="transaction-icon">
                  {transaction.type === 'credit' ? <FaPlus /> : <FaMinus />}
                </div>
                <div className="transaction-details">
                  <h3>{transaction.description}</h3>
                  <p className="transaction-date">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="transaction-amount">
                  {transaction.type === 'credit' ? '+' : '-'}
                  ₹{transaction.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet; 