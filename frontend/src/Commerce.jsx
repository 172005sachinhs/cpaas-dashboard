import { useEffect, useMemo, useState } from "react";

const API_BASE = "https://cpaas-dashboard-production.up.railway.app";

export default function Commerce() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [addingMoney, setAddingMoney] = useState(false);
  const [usingMoney, setUsingMoney] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showUseMoney, setShowUseMoney] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [useAmount, setUseAmount] = useState("");
  const [useDescription, setUseDescription] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD COMMERCE DATA
  // =====================================================

  const loadCommerce = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/commerce`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load Commerce data."
        );
      }

      setWallet(data.wallet || null);
      setTransactions(
        Array.isArray(data.transactions)
          ? data.transactions
          : []
      );
    } catch (err) {
      console.error(
        "Commerce load error:",
        err
      );

      setError(
        err.message ||
          "Unable to load Commerce data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommerce();
  }, []);

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalCredits = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          String(transaction.type)
            .toUpperCase() === "CREDIT"
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );
  }, [transactions]);

  const totalDebits = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          String(transaction.type)
            .toUpperCase() === "DEBIT"
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );
  }, [transactions]);

  // =====================================================
  // FILTER TRANSACTIONS
  // =====================================================

  const filteredTransactions = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return transactions.filter(
      (transaction) => {
        const type =
          String(
            transaction.type || ""
          ).toUpperCase();

        if (
          typeFilter !== "ALL" &&
          type !== typeFilter
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        return (
          String(
            transaction.description || ""
          )
            .toLowerCase()
            .includes(query) ||

          String(
            transaction.type || ""
          )
            .toLowerCase()
            .includes(query) ||

          String(
            transaction.status || ""
          )
            .toLowerCase()
            .includes(query)
        );
      }
    );
  }, [
    transactions,
    search,
    typeFilter,
  ]);

  // =====================================================
  // ADD MONEY
  // =====================================================

  const handleAddMoney = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numericAmount =
      Number(amount);

    if (
      !amount ||
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      setError(
        "Enter a valid amount greater than zero."
      );
      return;
    }

    if (numericAmount > 1000000) {
      setError(
        "For testing, the maximum top-up is ₹10,00,000."
      );
      return;
    }

    try {
      setAddingMoney(true);

      const response = await fetch(
        `${API_BASE}/api/commerce/add-money`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            amount: numericAmount,
            description:
              description.trim() ||
              "Wallet top-up",
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to add money."
        );
      }

      setSuccess(
        `₹${numericAmount.toLocaleString(
          "en-IN",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )} added successfully.`
      );

      setAmount("");
      setDescription("");
      setShowAddMoney(false);

      await loadCommerce();

    } catch (err) {
      console.error(
        "Add money error:",
        err
      );

      setError(
        err.message ||
          "Unable to add money."
      );
    } finally {
      setAddingMoney(false);
    }
  };

  // =====================================================
// USE MONEY / DEBIT
// =====================================================

const handleUseMoney = async (event) => {
  event.preventDefault();

  setError("");
  setSuccess("");

  const numericAmount = Number(useAmount);
  const currentBalance = Number(wallet?.balance || 0);

  if (
    !useAmount ||
    Number.isNaN(numericAmount) ||
    numericAmount <= 0
  ) {
    setError(
      "Enter a valid amount greater than zero."
    );
    return;
  }

  if (numericAmount > 1000000) {
    setError(
      "For testing, the maximum debit is ₹10,00,000."
    );
    return;
  }

  if (numericAmount > currentBalance) {
    setError(
      `Insufficient wallet balance. Available balance is ₹${currentBalance.toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}.`
    );
    return;
  }

  try {
    setUsingMoney(true);

    const response = await fetch(
      `${API_BASE}/api/commerce/use-money`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: numericAmount,
          description:
            useDescription.trim() ||
            "Wallet usage",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to use money."
      );
    }

    setSuccess(
      `₹${numericAmount.toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )} used successfully.`
    );

    setUseAmount("");
    setUseDescription("");
    setShowUseMoney(false);

    await loadCommerce();

  } catch (err) {
    console.error(
      "Use money error:",
      err
    );

    setError(
      err.message ||
        "Unable to use money."
    );

  } finally {
    setUsingMoney(false);
  }
};




  // =====================================================
  // FORMAT MONEY
  // =====================================================

  const formatMoney = (
    value,
    currency = "INR"
  ) => {
    const numericValue =
      Number(value || 0);

    if (currency === "INR") {
      return `₹${numericValue.toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`;
    }

    return `${currency} ${numericValue.toFixed(
      2
    )}`;
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString();
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="commerce-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="commerce-header">
        <div className="commerce-header-content">
          <div className="commerce-breadcrumb">
            Commerce
          </div>

          <h1>Commerce</h1>

          <p>
            Manage your wallet and transactions.
          </p>
        </div>

        <div className="commerce-header-actions">
          <button
            type="button"
            className="commerce-secondary-button"
            onClick={() => {
              setError("");
              setSuccess("");
              setUseAmount("");
              setUseDescription("");
              setShowAddMoney(false);
              setShowUseMoney(true);
            }}
            disabled={
              loading ||
              !wallet ||
              Number(wallet?.balance || 0) <= 0
            }
          >
            − Use Money
          </button>

          <button
            type="button"
            className="commerce-primary-button"
            onClick={() => {
              setError("");
              setSuccess("");
              setAmount("");
              setDescription("");
              setShowUseMoney(false);
              setShowAddMoney(true);
            }}
          >
            + Add Money
          </button>
        </div>
      </div>

      {/* =================================================
          ALERTS
      ================================================= */}

      {success && (
        <div className="commerce-alert commerce-success">
          {success}
        </div>
      )}

      {error && (
        <div className="commerce-alert commerce-error">
          {error}
        </div>
      )}

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (

        <div className="commerce-loading">
          Loading Commerce...
        </div>

      ) : (

        <>
          {/* =================================================
              WALLET + SUMMARY CARDS
          ================================================= */}

          <div className="commerce-summary-grid">

            {/* WALLET */}

            <div className="commerce-summary-card commerce-wallet-card">

              <div className="commerce-card-top">

                <div>
                  <span className="commerce-card-label">
                    Wallet Balance
                  </span>

                  <h2>
                    {formatMoney(
                      wallet?.balance,
                      wallet?.currency || "INR"
                    )}
                  </h2>

                  <span className="commerce-card-subtext">
                    Available balance
                  </span>
                </div>

                <div className="commerce-card-icon">
                  ₹
                </div>

              </div>

              <div className="commerce-wallet-footer">
                Currency:{" "}
                <strong>
                  {wallet?.currency || "INR"}
                </strong>
              </div>

            </div>

            {/* CREDITS */}

            <div className="commerce-summary-card">

              <div className="commerce-card-top">

                <div>
                  <span className="commerce-card-label">
                    Total Credits
                  </span>

                  <h2 className="commerce-credit-value">
                    {formatMoney(
                      totalCredits
                    )}
                  </h2>

                  <span className="commerce-card-subtext">
                    Money added
                  </span>
                </div>

                <div className="commerce-credit-icon">
                  ↑
                </div>

              </div>

            </div>

            {/* DEBITS */}

            <div className="commerce-summary-card">

              <div className="commerce-card-top">

                <div>
                  <span className="commerce-card-label">
                    Total Debits
                  </span>

                  <h2 className="commerce-debit-value">
                    {formatMoney(
                      totalDebits
                    )}
                  </h2>

                  <span className="commerce-card-subtext">
                    Money used
                  </span>
                </div>

                <div className="commerce-debit-icon">
                  ↓
                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              ADD MONEY FORM
          ================================================= */}

          {showAddMoney && (
            <div className="commerce-form-card">

              <div className="commerce-form-header">

                <div>
                  <h2>
                    Add Money
                  </h2>

                  <p>
                    Add funds to your wallet.
                  </p>
                </div>

                <button
                  type="button"
                  className="commerce-close-button"
                  onClick={() => {
                    if (!addingMoney) {
                      setShowAddMoney(false);
                    }
                  }}
                  disabled={addingMoney}
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={handleAddMoney}
              >

                <div className="commerce-form-grid">

                  <div className="commerce-field">

                    <label>
                      Amount
                    </label>

                    <div className="commerce-amount-input">

                      <span>
                        ₹
                      </span>

                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={amount}
                        onChange={(event) =>
                          setAmount(
                            event.target.value
                          )
                        }
                        placeholder="Enter amount"
                        disabled={addingMoney}
                      />

                    </div>

                  </div>

                  <div className="commerce-field">

                    <label>
                      Description
                    </label>

                    <input
                      type="text"
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value
                        )
                      }
                      placeholder="Wallet top-up"
                      disabled={addingMoney}
                    />

                  </div>

                </div>

                <div className="commerce-form-actions">

                  <button
                    type="button"
                    className="commerce-secondary-button"
                    onClick={() =>
                      setShowAddMoney(false)
                    }
                    disabled={addingMoney}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="commerce-primary-button"
                    disabled={addingMoney}
                  >
                    {addingMoney
                      ? "Adding..."
                      : "Add Money"}
                  </button>

                </div>

              </form>

            </div>
          )}

          {showUseMoney && (
  <div className="commerce-form-card">

    <div className="commerce-form-header">

      <div>
        <h2>
          Use Money
        </h2>

        <p>
          Deduct funds from your wallet.
        </p>
      </div>

      <button
        type="button"
        className="commerce-close-button"
        onClick={() => {
          if (!usingMoney) {
            setShowUseMoney(false);
          }
        }}
        disabled={usingMoney}
      >
        ×
      </button>

    </div>

    <form
      onSubmit={handleUseMoney}
    >

      <div className="commerce-form-grid">

        <div className="commerce-field">

          <label>
            Amount
          </label>

          <div className="commerce-amount-input">

            <span>
              ₹
            </span>

            <input
              type="number"
              min="1"
              max={Number(
                wallet?.balance || 0
              )}
              step="0.01"
              value={useAmount}
              onChange={(event) =>
                setUseAmount(
                  event.target.value
                )
              }
              placeholder="Enter amount"
              disabled={usingMoney}
            />

          </div>

          <small>
            Available balance:{" "}
            {formatMoney(
              wallet?.balance,
              wallet?.currency ||
                "INR"
            )}
          </small>

        </div>

        <div className="commerce-field">

          <label>
            Description
          </label>

          <input
            type="text"
            value={useDescription}
            onChange={(event) =>
              setUseDescription(
                event.target.value
              )
            }
            placeholder="WhatsApp campaign"
            disabled={usingMoney}
          />

        </div>

      </div>

      <div className="commerce-form-actions">

        <button
          type="button"
          className="commerce-secondary-button"
          onClick={() =>
            setShowUseMoney(false)
          }
          disabled={usingMoney}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="commerce-primary-button"
          disabled={usingMoney}
        >
          {usingMoney
            ? "Processing..."
            : "Use Money"}
        </button>

      </div>

    </form>

  </div>
)}

          {/* =================================================
              TRANSACTIONS
          ================================================= */}

          <div className="commerce-transactions-card">

            <div className="commerce-toolbar">

              <div>
                <h2>
                  Transactions
                </h2>

                <span>
                  {filteredTransactions.length} transaction
                  {filteredTransactions.length === 1
                    ? ""
                    : "s"}
                </span>
              </div>

              <div className="commerce-toolbar-controls">

                <div className="commerce-search">

                  <span>
                    ⌕
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search transactions..."
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearch("")
                      }
                    >
                      ×
                    </button>
                  )}

                </div>

                <select
                  className="commerce-filter"
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="ALL">
                    All Types
                  </option>

                  <option value="CREDIT">
                    Credits
                  </option>

                  <option value="DEBIT">
                    Debits
                  </option>
                </select>

              </div>

            </div>

            {/* =================================================
                TRANSACTION TABLE
            ================================================= */}

            {filteredTransactions.length === 0 ? (

              <div className="commerce-empty">

                <div className="commerce-empty-icon">
                  ₹
                </div>

                <h3>
                  No transactions found
                </h3>

                <p>
                  {search ||
                  typeFilter !== "ALL"
                    ? "Try changing your filters."
                    : "Your wallet transactions will appear here."}
                </p>

              </div>

            ) : (

              <div className="commerce-table-wrapper">

                <table className="commerce-table">

                  <thead>

                    <tr>

                      <th>
                        Type
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        Description
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Date
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredTransactions.map(
                      (transaction) => {

                        const credit =
                          String(
                            transaction.type
                          ).toUpperCase() ===
                          "CREDIT";

                        return (
                          <tr
                            key={
                              transaction.id
                            }
                          >

                            <td>

                              <span
                                className={`commerce-type ${
                                  credit
                                    ? "commerce-type-credit"
                                    : "commerce-type-debit"
                                }`}
                              >

                                <span>
                                  {credit
                                    ? "↑"
                                    : "↓"}
                                </span>

                                {credit
                                  ? "Credit"
                                  : "Debit"}

                              </span>

                            </td>

                            <td>

                              <strong
                                className={
                                  credit
                                    ? "commerce-credit-text"
                                    : "commerce-debit-text"
                                }
                              >
                                {credit
                                  ? "+"
                                  : "-"}
                                {formatMoney(
                                  transaction.amount,
                                  transaction.currency ||
                                    "INR"
                                )}
                              </strong>

                            </td>

                            <td>
                              {transaction.description ||
                                "-"}
                            </td>

                            <td>

                              <span className="commerce-status">
                                <span />
                                {transaction.status ||
                                  "SUCCESS"}
                              </span>

                            </td>

                            <td>
                              {formatDate(
                                transaction.created_at
                              )}
                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </>
      )}

    </div>
  );
}
