"use client";
import React, { useState, useEffect } from "react";
import {
  Mail,
  Users,
  FileText,
  Send,
  X,
  Check,
  Filter,
  MailCheck,
} from "lucide-react";
import Templates from "./components/Templates";
import Contacts from "./components/Contacts";

import {
  getContacts,
  getGroups,
  getTemplates,
  saveTemplate,
  saveContact,
  saveGroup,
  deleteTemplate,
  deleteContact,
   deleteGroup,
} from "@/lib/firestorehelperfunction";
import ReceivedMails from "./components/ReceivedMails";
import AITemplateEditor from "./components/AITemplateGenerator";
import Groups from "./components/Groups";


const EmailManagementSystem = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [sendEmailModal, setSendEmailModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [sending, setSending] = useState(false);

  // Form state
  const [formData, setFormData] = useState({});
  const loadData = async () => {
    const [templatesData, contactsData, groupsData] = await Promise.all([
      getTemplates(),
      getContacts(),
      getGroups(),
    ]);

    setTemplates(templatesData);
    setContacts(contactsData);
    setGroups(groupsData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(item || {});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveTemplate = async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      alert("Please fill in all fields");
      return;
    }

   await saveTemplate({
  id: editingItem?.id,
  name: formData.name,
  subject: formData.subject,
  intro: formData.intro,
  mainBody: formData.mainBody,
  footer: formData.footer,
});


    await loadData();
    closeModal();
  };

  const handleSaveContact = async () => {
  if (!formData.name || !formData.email) {
    alert("Please fill in name and email");
    return;
  }

  // Check for duplicate email
  const emailExists = contacts.some(
    (c) => c.email.toLowerCase() === formData.email.toLowerCase() && c.id !== editingItem?.id
  );

  if (emailExists) {
    alert("This email is already used by another contact.");
    return;
  }

  // Check for duplicate phone (if provided)
  if (formData.phone) {
    const phoneExists = contacts.some(
      (c) => c.phone === formData.phone && c.id !== editingItem?.id
    );
    if (phoneExists) {
      alert("This phone number is already used by another contact.");
      return;
    }
  }

  await saveContact({
    id: editingItem?.id,
    name: formData.name,
    email: formData.email,
    phone: formData.phone || "",
    groupId: formData.groupId || "",
  });

  await loadData();
  closeModal();
};


 const handleSaveGroup = async () => {
  if (!formData.name) {
    alert("Please enter a group name");
    return;
  }

  // Check for duplicate group name (case-insensitive)
  const groupExists = groups.some(
    (g) => g.name.toLowerCase() === formData.name.toLowerCase() && g.id !== editingItem?.id
  );

  if (groupExists) {
    alert("A group with this name already exists.");
    return;
  }

  await saveGroup({
    id: editingItem?.id,
    name: formData.name,
    description: formData.description || "",
  });

  await loadData();
  closeModal();
};


  const handleSave = () => {
    if (modalType === "template") {
      handleSaveTemplate();
    } else if (modalType === "contact") {
      handleSaveContact();
    } else {
      handleSaveGroup();
    }
  };

  const handleDelete = async (type, id) => {
  if (!confirm("Are you sure you want to delete this item?")) return;

  try {
    if (type === "template") {
      await deleteTemplate(id);
    } else if (type === "contact") {
      await deleteContact(id);
    } else if (type === "group") {
      await deleteGroup(id); // ✅ Delete group safely
    }

    await loadData(); // Refresh data after deletion
  } catch (error) {
    console.error("Delete failed:", error);
    alert("Failed to delete item");
  }
};


  const toggleContactSelection = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectGroupContacts = (groupId) => {
    const groupContacts = contacts
      .filter((c) => c.groupId === groupId)
      .map((c) => c.id);
    setSelectedContacts(groupContacts);
  };

  const sendEmail = async (to, subject, html) => {
    const res = await fetch("/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to send email");
    }

    return res.json();
  };

 const handleSendBulkEmail = async () => {
  try {
    setSending(true);

    const selectedContactsList = contacts.filter((c) =>
      selectedContacts.includes(c.id)
    );

    for (const contact of selectedContactsList) {
      // Combine intro, mainBody, and footer
      let body = `${selectedTemplate.intro || ""}\n\n${selectedTemplate.mainBody || ""}\n\n${selectedTemplate.footer || ""}`;

      // Replace placeholders
      body = body.replace(/\{\{name\}\}/g, contact.name || "");
      body = body.replace(/\{\{email\}\}/g, contact.email || "");

      // Send email
      await sendEmail(contact.email, selectedTemplate.subject, body);
    }

    alert(`Successfully sent ${selectedContactsList.length} emails!`);
    setSendEmailModal(false);
  } catch (error) {
    console.error(error);
    alert("Failed to send some emails");
  } finally {
    setSending(false);
  }
};


  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === "all" || c.groupId === filterGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Email Manager
              </h1>
            </div>
            <div className="text-sm text-gray-500">Production Ready v1.0</div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === "templates"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab("contacts")}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === "contacts"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Contacts
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === "groups"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Filter className="w-4 h-4 inline mr-2" />
              Groups
            </button>
            <button
              onClick={() => setActiveTab("received-mails")}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === "received-mails"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <MailCheck className="w-4 h-4 inline mr-2" />
              My Mails
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Templates Tab */}
        {activeTab === "templates" && (
          <>
            <Templates
              openModal={openModal}
              templates={templates}
                handleDelete={handleDelete}
              setSendEmailModal={setSendEmailModal}
              setSelectedTemplate={setSelectedTemplate}
              setSelectedContacts={setSelectedContacts}
            />
          </>
        )}

        {/* Contacts Tab */}
        {activeTab === "contacts" && (
          <Contacts
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterGroup={filterGroup}
            openModal={openModal}
            groups={groups}
            filteredContacts={filteredContacts}
            handleDelete={handleDelete}
            setFilterGroup={setFilterGroup}
          />
        )}

        {/* Groups Tab */}
        {activeTab === "groups" && (
          <Groups openModal={openModal} groups={groups} contacts={contacts}  handleDelete={handleDelete}  />
        )}
        {activeTab === "received-mails" && <ReceivedMails />}
      </main>

      {/* Modal */}
      {showModal && (
       <div className="fixed inset-0 backdrop-blur-lg bg-black/20 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-black">
                {editingItem ? "Edit" : "Create"}{" "}
                {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
             {modalType === "template" && (
  <>
    {/* Template Name */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Template Name
      </label>
      <input
        type="text"
        value={formData.name || ""}
        onChange={(e) => handleInputChange("name", e.target.value)}
        placeholder="Add template name"
        className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {/* Subject */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Subject Line
      </label>
      <input
        type="text"
        value={formData.subject || ""}
        onChange={(e) => handleInputChange("subject", e.target.value)}
        placeholder="Add subject"
        className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {/* Email Intro */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email Introduction
      </label>
      <textarea
        rows="3"
        value={formData.intro || ""}
        onChange={(e) => handleInputChange("intro", e.target.value)}
        placeholder="Add intro..."
        className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {/* MAIN EMAIL SECTION */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Main Email Section
      </label>
      <textarea
        rows="8"
        value={formData.mainBody || ""}
        onChange={(e) => handleInputChange("mainBody", e.target.value)}
        placeholder="Add more info..."
        className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-xs text-gray-500 mt-1">
        Tip: Use {"{{name}}"} and {"{{email}}"} for personalization
      </p>
    </div>

    {/* Footer / Signature */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email Footer / Signature
      </label>
      <textarea
        rows="3"
        value={formData.footer || ""}
        onChange={(e) => handleInputChange("footer", e.target.value)}
        placeholder="Add signature..."
        className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {/* AI Editor */}
    <AITemplateEditor
      formData={formData}
      setFormData={setFormData}
    />
  </>
)}


             {modalType === "contact" && (
  <>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Name
      </label>
      <input
        type="text"
        value={formData.name || ""}
        onChange={(e) => handleInputChange("name", e.target.value)}
        className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email
      </label>
      <input
        type="email"
        value={formData.email || ""}
        onChange={(e) => handleInputChange("email", e.target.value)}
        className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Phone Number
      </label>
      <input
        type="tel"
        value={formData.phone || ""}
        onChange={(e) => handleInputChange("phone", e.target.value)}
        className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="e.g. +1 555 123 4567"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Group
      </label>
      <select
        value={formData.groupId || ""}
        onChange={(e) => handleInputChange("groupId", e.target.value)}
        className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">No Group</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
    </div>
  </>
)}


              {modalType === "group" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      rows="3"
                      className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-black border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {sendEmailModal && (
       <div className="fixed inset-0 backdrop-blur-lg bg-black/20 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Send Bulk Email</h3>
              <button
                onClick={() => setSendEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  {selectedTemplate.name}
                </h4>
                <p className="text-sm text-blue-800">
                  <strong>Subject:</strong> {selectedTemplate.subject}
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-3 text-gray-800">Select Recipients</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => selectGroupContacts(group.id)}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                    >
                      Select all in {group.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto mb-6">
                {contacts.map((contact) => {
                  const group = groups.find((g) => g.id === contact.groupId);
                  const isSelected = selectedContacts.includes(contact.id);
                  return (
                    <label
                      key={contact.id}
                      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                        isSelected ? "bg-blue-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleContactSelection(contact.id)}
                        className="w-4 h-4 text-blue-600 rounded mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {contact.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contact.email}
                        </div>
                      </div>
                      {group && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {group.name}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {selectedContacts.length} recipient
                  {selectedContacts.length !== 1 ? "s" : ""} selected
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSendEmailModal(false)}
                    className="px-4 text-black py-2 border rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendBulkEmail}
                    disabled={selectedContacts.length === 0 || sending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Emails
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailManagementSystem;
