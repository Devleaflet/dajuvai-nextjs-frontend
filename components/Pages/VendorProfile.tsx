'use client';

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useVendorAuth } from "@/lib/context/VendorAuthContext";
import { VendorAuthService } from "@/lib/services/vendorAuthService";
import { API_BASE_URL } from "@/lib/config";
import "@/styles/VendorProfile.css";

interface VendorProfileData {
  id: number | null;
  businessName: string;
  email: string;
  phoneNumber: string;
  businessAddress: string;
  taxNumber: string;
  businessRegNumber: string;
  citizenshipDocuments: string[];
  taxDocuments: string[];
  accountName: string;
  bankName: string;
  accountNumber: string;
  bankBranch: string;
  profilePicture: string;
}

type ProfileTab = "details" | "credentials";

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
};

const extractVendor = (payload: unknown): Record<string, unknown> | null => {
  if (!payload || typeof payload !== "object") return null;

  const top = payload as Record<string, unknown>;
  if (top["vendor"] && typeof top["vendor"] === "object") {
    return top["vendor"] as Record<string, unknown>;
  }

  const data = top["data"];
  if (data && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>;
    if (dataRecord["vendor"] && typeof dataRecord["vendor"] === "object") {
      return dataRecord["vendor"] as Record<string, unknown>;
    }
    return dataRecord;
  }

  return null;
};

const normalizeVendorProfile = (vendor: Record<string, unknown>): VendorProfileData => {
  const districtValue = vendor["district"];
  const districtName =
    districtValue &&
    typeof districtValue === "object" &&
    "name" in districtValue &&
    typeof (districtValue as { name?: unknown }).name === "string"
      ? ((districtValue as { name: string }).name || "")
      : "";

  return {
    id: typeof vendor["id"] === "number" ? vendor["id"] : null,
    businessName: typeof vendor["businessName"] === "string" ? vendor["businessName"] : "",
    email: typeof vendor["email"] === "string" ? vendor["email"] : "",
    phoneNumber: typeof vendor["phoneNumber"] === "string" ? vendor["phoneNumber"] : "",
    businessAddress:
      typeof vendor["businessAddress"] === "string" && vendor["businessAddress"]
        ? vendor["businessAddress"]
        : districtName,
    taxNumber: typeof vendor["taxNumber"] === "string" ? vendor["taxNumber"] : "",
    businessRegNumber:
      typeof vendor["businessRegNumber"] === "string" ? vendor["businessRegNumber"] : "",
    citizenshipDocuments: toStringArray(vendor["citizenshipDocuments"]),
    taxDocuments: toStringArray(vendor["taxDocuments"]),
    accountName: typeof vendor["accountName"] === "string" ? vendor["accountName"] : "",
    bankName: typeof vendor["bankName"] === "string" ? vendor["bankName"] : "",
    accountNumber: typeof vendor["accountNumber"] === "string" ? vendor["accountNumber"] : "",
    bankBranch: typeof vendor["bankBranch"] === "string" ? vendor["bankBranch"] : "",
    profilePicture: typeof vendor["profilePicture"] === "string" ? vendor["profilePicture"] : "",
  };
};

const VendorProfile: React.FC = () => {
  const { authState } = useVendorAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("details");
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [resetToken, setResetToken] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!authState.token) {
        if (isMounted) {
          setProfileLoading(false);
          setProfileError("Please login to view your profile.");
        }
        return;
      }

      setProfileLoading(true);
      setProfileError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/vendors/auth/vendor`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${authState.token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to load profile (${response.status})`);
        }

        const payload = (await response.json()) as unknown;
        const vendor = extractVendor(payload);
        if (!vendor) {
          throw new Error("Vendor data is not available.");
        }

        if (isMounted) {
          setProfile(normalizeVendorProfile(vendor));
        }
      } catch (error) {
        if (isMounted) {
          setProfileError(error instanceof Error ? error.message : "Unable to load profile.");
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [authState.token]);

  useEffect(() => {
    if (activeTab === "credentials") {
      setForgotEmail(profile?.email || authState.vendor?.email || "");
    }
  }, [activeTab, profile?.email, authState.vendor?.email]);

  const avatarText = useMemo(() => {
    const source = profile?.businessName || authState.vendor?.businessName || "V";
    return source.charAt(0).toUpperCase();
  }, [profile?.businessName, authState.vendor?.businessName]);

  const paymentMethods = useMemo(() => {
    if (!profile) return [];
    if (!profile.bankName && !profile.accountNumber && !profile.accountName) return [];
    return [
      {
        id: "primary",
        name: profile.bankName || "Bank account",
        holder: profile.accountName || "Account holder",
        number: profile.accountNumber || "",
      },
    ];
  }, [profile]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg(null);
    const res = await VendorAuthService.forgotPassword(forgotEmail);
    setForgotMsg(res.message);
    setForgotLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg(null);
    const res = await VendorAuthService.resetPassword(newPass, confirmPass, resetToken);
    setResetMsg(res.message);
    setResetLoading(false);
  };

  const renderInfoField = (label: string, value?: string) => (
    <div className="vendor-profile-page__field">
      <label>{label}</label>
      <div className="vendor-profile-page__field-value">{value || "Not provided"}</div>
    </div>
  );

  const renderDocumentSection = (label: string, docs: string[]) => (
    <div className="vendor-profile-page__document-group">
      <label>{label}</label>
      <div className="vendor-profile-page__document-box">
        {docs.length > 0 ? (
          <div className="vendor-profile-page__document-grid">
            {docs.map((doc, index) => (
              <a
                key={`${label}-${index}`}
                href={doc}
                target="_blank"
                rel="noreferrer"
                className="vendor-profile-page__document-thumb"
                title="Open document"
              >
                <Image
                  src={doc}
                  alt={`${label} ${index + 1}`}
                  width={72}
                  height={72}
                  unoptimized
                />
              </a>
            ))}
          </div>
        ) : (
          <span className="vendor-profile-page__empty-inline">No documents uploaded</span>
        )}
      </div>
    </div>
  );

  return (
    <main className="dashboard__main">
      <div className="vendor-profile-page">
        <section className="vendor-profile-page__card">
          <aside className="vendor-profile-page__sidebar">
            <div className="vendor-profile-page__avatar-wrap">
              {profile?.profilePicture ? (
                <Image
                  className="vendor-profile-page__avatar-image"
                  src={profile.profilePicture}
                  alt="Profile"
                  width={74}
                  height={74}
                  unoptimized
                />
              ) : (
                <div className="vendor-profile-page__avatar">{avatarText}</div>
              )}
            </div>
            <button
              className={`vendor-profile-page__side-btn ${activeTab === "details" ? "vendor-profile-page__side-btn--active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              Manage Details
            </button>
            <button
              className={`vendor-profile-page__side-btn ${activeTab === "credentials" ? "vendor-profile-page__side-btn--muted" : ""}`}
              onClick={() => setActiveTab("credentials")}
            >
              Change Credentials
            </button>
          </aside>

          <div className="vendor-profile-page__content">
            {activeTab === "details" && (
              <>
                <h2 className="vendor-profile-page__title">Vendor Profile</h2>

                {profileLoading && <div className="vendor-profile-page__state">Loading profile...</div>}
                {!profileLoading && profileError && (
                  <div className="vendor-profile-page__state vendor-profile-page__state--error">{profileError}</div>
                )}

                {!profileLoading && !profileError && profile && (
                  <>
                    <div className="vendor-profile-page__grid">
                      {renderInfoField("Business Name", profile.businessName)}
                      {renderInfoField("Email", profile.email)}
                      {renderInfoField("Phone Number", profile.phoneNumber)}
                      {renderInfoField("Business Address", profile.businessAddress)}
                      {renderInfoField("Tax Number", profile.taxNumber)}
                      {renderInfoField("Business Registration Number", profile.businessRegNumber)}
                    </div>

                    {renderDocumentSection("Citizenship Documents", profile.citizenshipDocuments)}
                    {renderDocumentSection("Tax Documents", profile.taxDocuments)}

                    <div className="vendor-profile-page__document-group">
                      <label>Payment Options</label>
                      <div className="vendor-profile-page__payment-box">
                        {paymentMethods.length > 0 ? (
                          <div className="vendor-profile-page__payment-list">
                            {paymentMethods.map((method) => (
                              <div
                                key={method.id}
                                className="vendor-profile-page__payment-item"
                              >
                                <strong>{method.name}</strong>
                                <span>{method.holder}</span>
                                {method.number && <span>{method.number}</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="vendor-profile-page__empty-payment">
                            <span className="vendor-profile-page__empty-inline">No payment methods added</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === "credentials" && (
              <div className="vendor-profile-page__credentials">
                <h2 className="vendor-profile-page__title">Account Credentials</h2>

                <section className="vendor-profile-page__credentials-card">
                  <h3>Forgot Password</h3>
                  <form onSubmit={handleForgotPassword}>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? "Sending..." : "Send Reset Email"}
                    </button>
                  </form>
                  {forgotMsg && <p className="vendor-profile-page__message">{forgotMsg}</p>}
                </section>

                <section className="vendor-profile-page__credentials-card">
                  <h3>Reset Password</h3>
                  <form onSubmit={handleResetPassword}>
                    <input
                      type="text"
                      placeholder="Reset token"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      disabled={resetLoading}
                    >
                      {resetLoading ? "Resetting..." : "Reset Password"}
                    </button>
                  </form>
                  {resetMsg && <p className="vendor-profile-page__message">{resetMsg}</p>}
                </section>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default VendorProfile;