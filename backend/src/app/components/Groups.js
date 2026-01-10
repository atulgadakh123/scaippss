import { Edit2, Trash2, Users, Plus, Filter, Eye } from "lucide-react";
import React, { useState } from "react";

function Groups({ openModal, groups, contacts, handleDelete }) {
  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroupView = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Contact Groups</h2>
        <button
          onClick={() => openModal("group")}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Group
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups?.map((group) => {
          const groupContacts = contacts?.filter(
            (c) => c.groupId === group.id
          );
          const isExpanded = expandedGroups[group.id];

          return (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition"
            >
              {/* Header: Group Name + Edit/Delete/View */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {group.name}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal("group", group)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete("group", group.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleGroupView(group.id)}
                    className="p-1.5 text-gray-400 hover:text-green-600 transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3">{group.description}</p>

              {/* Contact Count */}
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <Users className="w-4 h-4 mr-1" />
                {groupContacts.length} contact
                {groupContacts.length !== 1 ? "s" : ""}
              </div>

              {/* Contact List (toggle visibility) */}
              {isExpanded && groupContacts.length > 0 && (
                <div className="mt-2 border-t pt-2 max-h-40 overflow-y-auto">
                  {groupContacts.map((c) => (
                    <div
                      key={c.id}
                      className="flex justify-between text-sm bg-gray-10 px-3 py-2 rounded mb-1"
                    >
                      <span className="text-gray-500 font-bold">{c.name}</span>
                      <span className="text-gray-500">{c.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty State */}
        {groups.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No groups yet. Create your first group!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Groups;
