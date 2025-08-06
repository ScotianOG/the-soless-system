// InviteSection.tsx
import { useState, useEffect } from "react";
import { Share2, Copy, Check, Users } from "lucide-react";
import { invitesApi } from "../lib/api";
import { Invite } from "../lib/api/types";

interface InviteSectionProps {
  wallet: string;
}

export const InviteSection: React.FC<InviteSectionProps> = ({ wallet }) => {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingInvites, setFetchingInvites] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch invite link and history
  useEffect(() => {
    const fetchInviteData = async () => {
      if (!wallet) return;

      setFetchingInvites(true);
      try {
        // Fetch invite history
        const invitesResponse = await invitesApi.getUserInvites(wallet);
        setInvites(invitesResponse.invites);

        // If we have an existing invite, use it
        if (invitesResponse.invites.length > 0) {
          setInviteLink(invitesResponse.invites[0].fullInviteLink);
        }
      } catch (error) {
        console.error("Failed to fetch invite data", error);
      } finally {
        setFetchingInvites(false);
      }
    };

    if (wallet) {
      fetchInviteData();
    }
  }, [wallet]);

  const generateInviteLink = async () => {
    if (!wallet) {
      setError("Wallet address is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await invitesApi.createInvite(wallet);
      setInviteLink(response.inviteLink);
    } catch (error: unknown) {
      console.error("Error generating invite:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate invite link";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      setError("Failed to copy to clipboard");
    }
  };

  return (
    <div className="bg-[#030a10]/70 backdrop-blur-lg rounded-xl border border-[#16DFED]/20 overflow-hidden w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#061826] px-4 py-3 border-b border-[#16DFED]/10">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Users className="h-4 w-4 mr-2 text-[#16DFED]" />
          Invite Friends
        </h3>
        <button
          onClick={generateInviteLink}
          disabled={loading || !wallet}
          className={`bg-gradient-to-r from-[#16DFED] to-[#0099cc] hover:from-[#14c8d4] hover:to-[#0086b3] text-black px-3 py-1 rounded text-sm flex items-center space-x-1 transition-all ${
            loading || !wallet ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Share2 className="h-3.5 w-3.5 mr-1" />
          <span>{loading ? "Generating..." : "Generate"}</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="text-red-400 text-sm mb-3 p-2 bg-red-400/10 rounded border border-red-400/20">
            {error}
          </div>
        )}

        {inviteLink && (
          <div className="mb-4">
            <div className="flex items-center space-x-1 mb-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 bg-black/30 border border-[#16DFED]/20 rounded px-3 py-2 text-sm text-white focus:border-[#16DFED]/40 focus:ring-1 focus:ring-[#16DFED]/30"
              />
              <button
                onClick={copyToClipboard}
                className="bg-[#0D2237] hover:bg-[#0D2237]/80 text-[#16DFED] p-2 rounded"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-[#16DFED]/70 text-xs">
              Earn 10 points for each friend who joins using your invite!
            </p>
          </div>
        )}

        {/* Invite History Section */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-white/80">
              Invite History
            </h4>
            <span className="text-xs text-[#16DFED]/60">
              {invites.length} {invites.length === 1 ? "invite" : "invites"}
            </span>
          </div>

          {fetchingInvites ? (
            <div className="animate-pulse bg-white/5 h-16 rounded"></div>
          ) : invites.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex justify-between items-center py-2 px-3 bg-[#061826]/70 rounded border border-[#16DFED]/10 text-sm"
                >
                  <div>
                    <p className="text-white text-xs flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#16DFED] mr-1.5"></span>
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-[#16DFED]/70 text-xs mt-0.5">
                      {invite.usedCount || 0} use
                      {invite.usedCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center bg-[#16DFED]/10 py-0.5 px-2 rounded">
                    <span className="text-[#16DFED] text-xs mr-1">
                      {invite.claimsCount}
                    </span>
                    <Users className="h-3 w-3 text-[#16DFED]/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/50 text-xs p-3 bg-white/5 rounded border border-white/10 text-center">
              No invite history. Generate your first invite link above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
