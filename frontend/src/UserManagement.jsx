import { useEffect, useMemo, useState } from "react";

const API_BASE = "https://cpaas-dashboard-production.up.railway.app";

export default function UserManagement() {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company_name: "",
    status: "ACTIVE",
  });

  // =====================================================
  // LOAD USERS
  // =====================================================

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/users`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load users"
        );
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("User Management GET error:", err);

      setError(
        err.message || "Unable to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // =====================================================
  // FILTER USERS
  // =====================================================

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      return (
        String(user.name || "")
          .toLowerCase()
          .includes(query) ||

        String(user.email || "")
          .toLowerCase()
          .includes(query) ||

        String(user.company_name || "")
          .toLowerCase()
          .includes(query) ||

        String(user.status || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [users, search]);

  // =====================================================
  // FORM HELPERS
  // =====================================================

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      company_name: "",
      status: "ACTIVE",
    });

    setEditingUser(null);
  };

  const openAddForm = () => {
    setSuccess("");
    setError("");

    resetForm();

    setShowForm(true);
  };

  const openEditForm = (user) => {
    setSuccess("");
    setError("");

    setEditingUser(user);

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      company_name: user.company_name || "",
      status: user.status || "ACTIVE",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  };

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE USER
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;
    const companyName =
      form.company_name.trim();

    if (!name) {
      setError("Name is required.");
      return;
    }

    if (!email) {
      setError("Email is required.");
      return;
    }

    if (!editingUser && !password) {
      setError("Password is required for a new user.");
      return;
    }

    if (
      password &&
      password.length < 6
    ) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name,
        email,
        company_name: companyName,
        status: form.status,
      };

      /*
       * Password is sent only when:
       * 1. Creating a user
       * 2. Updating a password
       */
      if (password) {
        payload.password = password;
      }

      const url = editingUser
        ? `${API_BASE}/api/users/${editingUser.id}`
        : `${API_BASE}/api/users`;

      const method = editingUser
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save user"
        );
      }

      setSuccess(
        editingUser
          ? "User updated successfully."
          : "User created successfully."
      );

      setShowForm(false);
      resetForm();

      await loadUsers();

    } catch (err) {
      console.error(
        "User Management save error:",
        err
      );

      setError(
        err.message ||
          "Unable to save user."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // TOGGLE STATUS
  // =====================================================

  const toggleStatus = async (user) => {
    setError("");
    setSuccess("");

    const nextStatus =
      String(user.status).toUpperCase() ===
      "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    try {
      const response = await fetch(
        `${API_BASE}/api/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            company_name:
              user.company_name || "",
            status: nextStatus,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update user status"
        );
      }

      setSuccess(
        `User ${nextStatus === "ACTIVE"
          ? "activated"
          : "deactivated"
        } successfully.`
      );

      await loadUsers();

    } catch (err) {
      console.error(
        "User status update error:",
        err
      );

      setError(
        err.message ||
          "Unable to update user status."
      );
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="user-management-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="um-page-header">

        <div>
          <div className="um-breadcrumb">
            User Management
          </div>

          <h1>
            User Management
          </h1>

          <p>
            Manage users and their account status.
          </p>
        </div>

        <button
          className="um-primary-button"
          onClick={openAddForm}
        >
          + Add User
        </button>

      </div>

      {/* =================================================
          SUCCESS
      ================================================= */}

      {success && (
        <div className="um-alert um-success">
          {success}
        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="um-alert um-error">
          {error}
        </div>
      )}

      {/* =================================================
          FORM
      ================================================= */}

      {showForm && (
        <div className="um-form-card">

          <div className="um-form-header">

            <div>
              <h2>
                {editingUser
                  ? "Edit User"
                  : "Add User"}
              </h2>

              <p>
                {editingUser
                  ? "Update the user information below."
                  : "Create a new user account."}
              </p>
            </div>

            <button
              type="button"
              className="um-close-button"
              onClick={closeForm}
              disabled={saving}
            >
              ×
            </button>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="um-form-grid">

              {/* NAME */}

              <div className="um-field">

                <label>
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter user name"
                  disabled={saving}
                />

              </div>

              {/* EMAIL */}

              <div className="um-field">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  disabled={saving}
                />

              </div>

              {/* COMPANY */}

              <div className="um-field">

                <label>
                  Company Name
                </label>

                <input
                  type="text"
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  disabled={saving}
                />

              </div>

              {/* PASSWORD */}

              <div className="um-field">

                <label>
                  Password
                  {editingUser && (
                    <span className="um-optional">
                      Optional
                    </span>
                  )}
                </label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    editingUser
                      ? "Leave blank to keep current password"
                      : "Enter password"
                  }
                  disabled={saving}
                />

              </div>

              {/* STATUS */}

              <div className="um-field">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>
                </select>

              </div>

            </div>

            <div className="um-form-actions">

              <button
                type="button"
                className="um-secondary-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="um-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingUser
                    ? "Update User"
                    : "Create User"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* =================================================
          USERS CARD
      ================================================= */}

      <div className="um-card">

        <div className="um-toolbar">

          <div>
            <h2>
              Users
            </h2>

            <span>
              {filteredUsers.length} user
              {filteredUsers.length === 1
                ? ""
                : "s"}
            </span>
          </div>

          <div className="um-search">

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
              placeholder="Search users..."
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

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="um-empty-state">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="um-empty-state">

            <div className="um-empty-icon">
              👤
            </div>

            <h3>
              No users found
            </h3>

            <p>
              {search
                ? "Try another search."
                : "Add your first user to get started."}
            </p>

          </div>
        ) : (
          <div className="um-table-wrapper">

            <table className="um-table">

              <thead>

                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {filteredUsers.map(
                  (user) => {

                    const active =
                      String(
                        user.status
                      ).toUpperCase() ===
                      "ACTIVE";

                    return (
                      <tr
                        key={user.id}
                      >

                        {/* USER */}

                        <td>

                          <div className="um-user-cell">

                            <div className="um-avatar">
                              {(
                                user.name ||
                                "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {user.name}
                              </strong>

                              <small>
                                User #{user.id}
                              </small>

                            </div>

                          </div>

                        </td>

                        {/* EMAIL */}

                        <td>
                          {user.email}
                        </td>

                        {/* COMPANY */}

                        <td>
                          {user.company_name ||
                            "-"}
                        </td>

                        {/* STATUS */}

                        <td>

                          <button
                            type="button"
                            className={`um-status ${
                              active
                                ? "um-status-active"
                                : "um-status-inactive"
                            }`}
                            onClick={() =>
                              toggleStatus(user)
                            }
                            title="Click to change status"
                          >
                            <span />
                            {active
                              ? "Active"
                              : "Inactive"}
                          </button>

                        </td>

                        {/* CREATED */}

                        <td>
                          {formatDate(
                            user.created_at
                          )}
                        </td>

                        {/* ACTION */}

                        <td>

                          <button
                            type="button"
                            className="um-edit-button"
                            onClick={() =>
                              openEditForm(user)
                            }
                          >
                            Edit
                          </button>

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

    </div>
  );
}
