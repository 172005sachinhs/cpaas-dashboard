import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:5000";

export default function AddressBook() {
  const [contacts, setContacts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    email: "",
    company_name: "",
    status: "ACTIVE",
  });

  // =====================================================
  // LOAD CONTACTS
  // =====================================================

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/address-book/contacts`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load contacts."
        );
      }

      setContacts(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Address Book load error:",
        err
      );

      setError(
        err.message ||
          "Unable to load contacts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredContacts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) => {
      return (
        String(contact.name || "")
          .toLowerCase()
          .includes(query) ||

        String(contact.phone_number || "")
          .toLowerCase()
          .includes(query) ||

        String(contact.email || "")
          .toLowerCase()
          .includes(query) ||

        String(contact.company_name || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [contacts, search]);

  // =====================================================
  // FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      name: "",
      phone_number: "",
      email: "",
      company_name: "",
      status: "ACTIVE",
    });

    setEditingContact(null);
  };

  const openAddContact = () => {
    setError("");
    setSuccess("");

    resetForm();

    setShowForm(true);
  };

  const openEditContact = (contact) => {
    setError("");
    setSuccess("");

    setEditingContact(contact);

    setForm({
      name: contact.name || "",
      phone_number:
        contact.phone_number || "",
      email: contact.email || "",
      company_name:
        contact.company_name || "",
      status:
        contact.status || "ACTIVE",
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
  // INPUT
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
  // SAVE CONTACT
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name =
      form.name.trim();

    const phone =
      form.phone_number.trim();

    const email =
      form.email.trim();

    const company =
      form.company_name.trim();

    if (!name) {
      setError("Contact name is required.");
      return;
    }

    if (!phone) {
      setError("Phone number is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name,
        phone_number: phone,
        email,
        company_name: company,
        status: form.status,
      };

      const url = editingContact
        ? `${API_BASE}/api/address-book/contacts/${editingContact.id}`
        : `${API_BASE}/api/address-book/contacts`;

      const method = editingContact
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save contact."
        );
      }

      setSuccess(
        editingContact
          ? "Contact updated successfully."
          : "Contact added successfully."
      );

      setShowForm(false);
      resetForm();

      await loadContacts();

    } catch (err) {
      console.error(
        "Address Book save error:",
        err
      );

      setError(
        err.message ||
          "Unable to save contact."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE CONTACT
  // =====================================================

  const deleteContact = async (contact) => {
    const confirmed =
      window.confirm(
        `Delete ${contact.name}?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE}/api/address-book/contacts/${contact.id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to delete contact."
        );
      }

      setSuccess(
        "Contact deleted successfully."
      );

      await loadContacts();

    } catch (err) {
      console.error(
        "Address Book delete error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete contact."
      );
    }
  };

  // =====================================================
  // STATUS
  // =====================================================

  const toggleStatus = async (contact) => {
    setError("");
    setSuccess("");

    const nextStatus =
      String(contact.status)
        .toUpperCase() === "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    try {
      const response = await fetch(
        `${API_BASE}/api/address-book/contacts/${contact.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: contact.name,
            phone_number:
              contact.phone_number,
            email:
              contact.email || "",
            company_name:
              contact.company_name || "",
            status: nextStatus,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update status."
        );
      }

      setSuccess(
        `Contact ${
          nextStatus === "ACTIVE"
            ? "activated"
            : "deactivated"
        } successfully.`
      );

      await loadContacts();

    } catch (err) {
      console.error(
        "Address Book status error:",
        err
      );

      setError(
        err.message ||
          "Unable to update contact status."
      );
    }
  };

  // =====================================================
  // DATE
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
    <div className="address-book-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="ab-page-header">

        <div>

          <div className="ab-breadcrumb">
            Address Book
          </div>

          <h1>
            Address Book
          </h1>

          <p>
            Manage your contacts and recipients.
          </p>

        </div>

        <button
          className="ab-primary-button"
          onClick={openAddContact}
        >
          + Add Contact
        </button>

      </div>

      {/* =================================================
          ALERTS
      ================================================= */}

      {success && (
        <div className="ab-alert ab-success">
          {success}
        </div>
      )}

      {error && (
        <div className="ab-alert ab-error">
          {error}
        </div>
      )}

      {/* =================================================
          ADD / EDIT FORM
      ================================================= */}

      {showForm && (
        <div className="ab-form-card">

          <div className="ab-form-header">

            <div>

              <h2>
                {editingContact
                  ? "Edit Contact"
                  : "Add Contact"}
              </h2>

              <p>
                {editingContact
                  ? "Update the contact information."
                  : "Add a new contact to your address book."}
              </p>

            </div>

            <button
              type="button"
              className="ab-close-button"
              onClick={closeForm}
              disabled={saving}
            >
              ×
            </button>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="ab-form-grid">

              {/* NAME */}

              <div className="ab-field">

                <label>
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter contact name"
                  disabled={saving}
                />

              </div>

              {/* PHONE */}

              <div className="ab-field">

                <label>
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="+91XXXXXXXXXX"
                  disabled={saving}
                />

              </div>

              {/* EMAIL */}

              <div className="ab-field">

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

              <div className="ab-field">

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

              {/* STATUS */}

              <div className="ab-field">

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

            <div className="ab-form-actions">

              <button
                type="button"
                className="ab-secondary-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="ab-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingContact
                    ? "Update Contact"
                    : "Add Contact"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* =================================================
          CONTACT LIST
      ================================================= */}

      <div className="ab-card">

        <div className="ab-toolbar">

          <div>

            <h2>
              Contacts
            </h2>

            <span>
              {filteredContacts.length} contact
              {filteredContacts.length === 1
                ? ""
                : "s"}
            </span>

          </div>

          <div className="ab-search">

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
              placeholder="Search contacts..."
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
          <div className="ab-empty-state">
            Loading contacts...
          </div>

        ) : filteredContacts.length === 0 ? (

          <div className="ab-empty-state">

            <div className="ab-empty-icon">
              👥
            </div>

            <h3>
              No contacts found
            </h3>

            <p>
              {search
                ? "Try a different search."
                : "Add your first contact to get started."}
            </p>

          </div>

        ) : (

          <div className="ab-table-wrapper">

            <table className="ab-table">

              <thead>

                <tr>

                  <th>
                    Contact
                  </th>

                  <th>
                    Phone
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Company
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredContacts.map(
                  (contact) => {

                    const active =
                      String(
                        contact.status
                      ).toUpperCase() ===
                      "ACTIVE";

                    return (
                      <tr
                        key={contact.id}
                      >

                        {/* CONTACT */}

                        <td>

                          <div className="ab-contact-cell">

                            <div className="ab-avatar">
                              {(
                                contact.name ||
                                "C"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {contact.name}
                              </strong>

                              <small>
                                Contact #{contact.id}
                              </small>

                            </div>

                          </div>

                        </td>

                        {/* PHONE */}

                        <td>
                          {contact.phone_number}
                        </td>

                        {/* EMAIL */}

                        <td>
                          {contact.email || "-"}
                        </td>

                        {/* COMPANY */}

                        <td>
                          {contact.company_name ||
                            "-"}
                        </td>

                        {/* STATUS */}

                        <td>

                          <button
                            type="button"
                            className={`ab-status ${
                              active
                                ? "ab-status-active"
                                : "ab-status-inactive"
                            }`}
                            onClick={() =>
                              toggleStatus(contact)
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
                            contact.created_at
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="ab-actions">

                            <button
                              type="button"
                              className="ab-edit-button"
                              onClick={() =>
                                openEditContact(
                                  contact
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="ab-delete-button"
                              onClick={() =>
                                deleteContact(
                                  contact
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

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