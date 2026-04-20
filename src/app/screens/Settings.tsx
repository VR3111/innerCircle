import { useState } from "react";
import { ArrowLeft, User, Lock, Bell, Trash2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { resetPassword } from "../../lib/auth";
import { toast } from "sonner";

const APP_VERSION = "1.0.0";

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentUsername = user?.user_metadata?.username || user?.email?.split("@")[0] || "";

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(currentUsername);
  const [savingUsername, setSavingUsername] = useState(false);

  const [sendingReset, setSendingReset] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("notifications_enabled") !== "false"
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed || trimmed === currentUsername) {
      setEditingUsername(false);
      return;
    }
    setSavingUsername(true);
    const { error } = await supabase.auth.updateUser({ data: { username: trimmed } });
    setSavingUsername(false);
    if (error) {
      toast.error("Failed to update username");
    } else {
      toast.success("Username updated");
      setEditingUsername(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await resetPassword(user.email);
      toast.success(`Reset link sent to ${user.email}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setSendingReset(false);
    }
  };

  const handleToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem("notifications_enabled", enabled ? "true" : "false");
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "DELETE") return;
    toast.info("To delete your account, email support@innercircle.app");
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="max-w-[375px] md:max-w-[640px] mx-auto flex items-center gap-3 px-4 h-16">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <span className="font-['Outfit'] font-bold text-white text-[15px]">Settings</span>
        </div>
      </div>

      <div className="max-w-[375px] md:max-w-[640px] mx-auto px-4 pt-6 space-y-6">

        {/* Account */}
        <div>
          <p className="font-['DM_Sans'] text-white/30 text-[11px] uppercase tracking-[0.14em] mb-3 px-1">
            Account
          </p>
          <div className="bg-[#111111] rounded-2xl overflow-hidden border border-white/5">

            {/* Username */}
            <div className="px-4 py-4 border-b border-white/5">
              <div className="flex items-start gap-3">
                <User size={16} strokeWidth={1.5} className="text-white/30 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-['DM_Sans'] text-white/30 text-[11px] mb-1.5">Username</p>
                  {editingUsername ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={e => setUsernameInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleSaveUsername(); if (e.key === "Escape") { setEditingUsername(false); setUsernameInput(currentUsername); } }}
                        autoFocus
                        maxLength={30}
                        className="flex-1 bg-white/8 text-white text-sm font-['DM_Sans'] px-3 py-1.5 rounded-lg outline-none border border-white/10 focus:border-white/25 transition-colors min-w-0"
                      />
                      <button
                        onClick={handleSaveUsername}
                        disabled={savingUsername}
                        className="text-xs font-['Outfit'] font-semibold text-[#2A9D8F] disabled:opacity-40 flex-shrink-0"
                      >
                        {savingUsername ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => { setEditingUsername(false); setUsernameInput(currentUsername); }}
                        className="text-xs font-['DM_Sans'] text-white/30 hover:text-white/50 flex-shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-['DM_Sans'] text-white text-sm">{currentUsername}</span>
                      <button
                        onClick={() => setEditingUsername(true)}
                        className="text-xs font-['DM_Sans'] text-white/30 hover:text-white/60 transition-colors ml-3 flex-shrink-0"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Change password */}
            <button
              onClick={handlePasswordReset}
              disabled={sendingReset}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] active:bg-white/5 transition-colors disabled:opacity-40"
            >
              <Lock size={16} strokeWidth={1.5} className="text-white/30 flex-shrink-0" />
              <span className="flex-1 text-left font-['DM_Sans'] text-white text-sm">
                {sendingReset ? "Sending…" : "Send password reset email"}
              </span>
              <ChevronRight size={14} strokeWidth={1.5} className="text-white/20" />
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <p className="font-['DM_Sans'] text-white/30 text-[11px] uppercase tracking-[0.14em] mb-3 px-1">
            Preferences
          </p>
          <div className="bg-[#111111] rounded-2xl overflow-hidden border border-white/5">
            <div className="flex items-center gap-3 px-4 py-4">
              <Bell size={16} strokeWidth={1.5} className="text-white/30 flex-shrink-0" />
              <span className="flex-1 font-['DM_Sans'] text-white text-sm">Notifications</span>
              <button
                onClick={() => handleToggleNotifications(!notificationsEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                  notificationsEnabled ? "bg-[#2A9D8F]" : "bg-white/15"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    notificationsEnabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div>
          <p className="font-['DM_Sans'] text-white/30 text-[11px] uppercase tracking-[0.14em] mb-3 px-1">
            Danger Zone
          </p>
          <div className="bg-[#111111] rounded-2xl overflow-hidden border border-white/5">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[#E63946]/5 active:bg-[#E63946]/8 transition-colors"
            >
              <Trash2 size={16} strokeWidth={1.5} className="text-[#E63946]/60 flex-shrink-0" />
              <span className="flex-1 text-left font-['DM_Sans'] text-[#E63946]/70 text-sm">
                Delete account
              </span>
              <ChevronRight size={14} strokeWidth={1.5} className="text-white/20" />
            </button>
          </div>
        </div>

        {/* App version */}
        <p className="text-center font-['DM_Sans'] text-white/20 text-xs pt-2 pb-6">
          Inner Circle v{APP_VERSION}
        </p>
      </div>

      {/* Delete confirmation sheet */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-4 pb-8"
          onClick={e => { if (e.target === e.currentTarget) { setShowDeleteConfirm(false); setDeleteConfirmText(""); } }}
        >
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="w-full max-w-[375px] bg-[#111111] rounded-2xl border border-white/8 p-6"
          >
            <h3 className="font-['Outfit'] font-bold text-white text-lg mb-2">Delete account?</h3>
            <p className="font-['DM_Sans'] text-white/50 text-sm mb-5 leading-relaxed">
              This is permanent and cannot be undone. Type{" "}
              <span className="text-white font-semibold">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              autoFocus
              className="w-full bg-white/5 text-white text-sm font-['DM_Sans'] px-4 py-3 rounded-xl outline-none border border-white/8 focus:border-[#E63946]/40 transition-colors mb-4 placeholder:text-white/20"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                className="flex-1 py-3 rounded-xl border border-white/8 font-['DM_Sans'] text-white/50 text-sm hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE"}
                className="flex-1 py-3 rounded-xl bg-[#E63946] font-['DM_Sans'] font-semibold text-white text-sm disabled:opacity-25 disabled:cursor-not-allowed transition-opacity"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
