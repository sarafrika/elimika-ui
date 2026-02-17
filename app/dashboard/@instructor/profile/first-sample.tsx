'use client'

import { useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { useUserProfile } from "../../../../context/profile-context";
import { useUserDomain } from "../../../../context/user-domain-context";

const profileData = {
    name: "Sonya Taylor",
    role: "Ui/Ux Developer",
    location: "West fransisco, Alabama",
    region: "New Jersey",
    phone: "+94 12345 6789",
    email: "spruko.space@gmail.com",
    website: "sprukotechnologies",
    id: "231234345565678",
    avatar: "https://i.pravatar.cc/150?img=47",
    online: true,
};

const skills = [
    { name: "Figma", level: 92, color: "#6366f1" },
    { name: "Adobe XD", level: 85, color: "#ec4899" },
    { name: "React.js", level: 78, color: "#06b6d4" },
    { name: "CSS / Tailwind", level: 88, color: "#10b981" },
    { name: "Prototyping", level: 80, color: "#f59e0b" },
];

const certificates = [
    { title: "Google UX Design", issuer: "Google", year: "2023", badge: "🏅" },
    { title: "Advanced React Development", issuer: "Meta", year: "2022", badge: "🎖️" },
    { title: "UI Design Fundamentals", issuer: "Coursera", year: "2021", badge: "🏆" },
    { title: "Accessibility Standards", issuer: "W3C", year: "2023", badge: "✅" },
];

const careerPathways = [
    { year: "2019", role: "Junior Designer", company: "PixelCraft Studio", color: "#6366f1" },
    { year: "2020", role: "UI Designer", company: "TechVibe Labs", color: "#ec4899" },
    { year: "2022", role: "Senior UX Designer", company: "Spruko Technologies", color: "#06b6d4" },
    { year: "2024", role: "Lead UI/UX Developer", company: "Spruko Technologies", color: "#10b981" },
];

const galleryImages = [
    { id: 1, bg: "linear-gradient(135deg,#667eea,#764ba2)", label: "App Redesign" },
    { id: 2, bg: "linear-gradient(135deg,#f093fb,#f5576c)", label: "Brand System" },
    { id: 3, bg: "linear-gradient(135deg,#4facfe,#00f2fe)", label: "Dashboard UI" },
    { id: 4, bg: "linear-gradient(135deg,#43e97b,#38f9d7)", label: "Mobile Flow" },
    { id: 5, bg: "linear-gradient(135deg,#fa709a,#fee140)", label: "Icon Pack" },
    { id: 6, bg: "linear-gradient(135deg,#a18cd1,#fbc2eb)", label: "Onboarding" },
];

const friends = [
    { name: "Alex Kim", role: "Product Designer", avatar: "https://i.pravatar.cc/60?img=11" },
    { name: "Maria Lopez", role: "Front-end Dev", avatar: "https://i.pravatar.cc/60?img=5" },
    { name: "Jake Russel", role: "Motion Designer", avatar: "https://i.pravatar.cc/60?img=12" },
    { name: "Priya Nair", role: "UX Researcher", avatar: "https://i.pravatar.cc/60?img=9" },
    { name: "Tom Chen", role: "Brand Designer", avatar: "https://i.pravatar.cc/60?img=15" },
    { name: "Sara Wells", role: "Visual Designer", avatar: "https://i.pravatar.cc/60?img=16" },
];

const TABS = ["About", "Skills Card", "Certificates", "Career Pathways", "Gallery", "Friends"];

function AboutTab() {
    return (
        <div style={{ padding: "28px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div style={cardStyle}>
                    <h3 style={sectionTitle}>Personal Info</h3>
                    <InfoRow icon="👤" label="Full Name" value={profileData.name} />
                    <InfoRow icon="💼" label="Profession" value={profileData.role} />
                    <InfoRow icon="📍" label="Location" value={profileData.location} />
                    <InfoRow icon="🗺️" label="Region" value={profileData.region} />
                </div>
                <div style={cardStyle}>
                    <h3 style={sectionTitle}>Contact Details</h3>
                    <InfoRow icon="📞" label="Phone" value={profileData.phone} />
                    <InfoRow icon="✉️" label="Email" value={profileData.email} />
                    <InfoRow icon="🌐" label="Website" value={profileData.website} />
                    <InfoRow icon="🪪" label="ID" value={profileData.id} />
                </div>
                <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
                    <h3 style={sectionTitle}>About Me</h3>
                    <p style={{ color: "#64748b", lineHeight: 1.8, margin: 0, fontSize: "0.95rem" }}>
                        I'm a passionate UI/UX Developer with over 5 years of experience crafting beautiful digital
                        experiences. I specialize in turning complex design challenges into simple, intuitive interfaces
                        that delight users. My work bridges the gap between design and development — I'm equally
                        comfortable in Figma and in code.
                    </p>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: "1rem" }}>{icon}</span>
            <span style={{ color: "#94a3b8", fontSize: "0.82rem", width: "80px", flexShrink: 0 }}>{label}</span>
            <span style={{ color: "#334155", fontSize: "0.9rem", fontWeight: 500 }}>{value}</span>
        </div>
    );
}

function SkillsTab() {
    return (
        <div style={{ padding: "28px 0" }}>
            <div style={cardStyle}>
                <h3 style={sectionTitle}>Technical Skills</h3>
                {skills.map((skill) => (
                    <div key={skill.name} style={{ marginBottom: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ fontWeight: 600, color: "#334155", fontSize: "0.9rem" }}>{skill.name}</span>
                            <span style={{ color: skill.color, fontWeight: 700, fontSize: "0.85rem" }}>{skill.level}%</span>
                        </div>
                        <div style={{ background: "#f1f5f9", borderRadius: "20px", height: "8px", overflow: "hidden" }}>
                            <div
                                style={{
                                    height: "100%",
                                    width: `${skill.level}%`,
                                    background: skill.color,
                                    borderRadius: "20px",
                                    transition: "width 1s ease",
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "20px" }}>
                {[["🎨", "Design Tools", "Figma, XD, Sketch"], ["⚛️", "Frontend", "React, Vue, HTML/CSS"], ["📐", "Prototyping", "InVision, Marvel"]].map(
                    ([icon, title, tools]) => (
                        <div key={title} style={{ ...cardStyle, textAlign: "center" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{icon}</div>
                            <div style={{ fontWeight: 700, color: "#334155", marginBottom: "4px" }}>{title}</div>
                            <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{tools}</div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

function CertificatesTab() {
    return (
        <div style={{ padding: "28px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {certificates.map((cert) => (
                <div key={cert.title} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ fontSize: "2.5rem" }}>{cert.badge}</div>
                    <div>
                        <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "2px" }}>{cert.title}</div>
                        <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{cert.issuer}</div>
                        <div style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: "4px" }}>Issued {cert.year}</div>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                        <span style={{ background: "#eff6ff", color: "#3b82f6", fontSize: "0.75rem", padding: "4px 10px", borderRadius: "20px", fontWeight: 600 }}>
                            Verified
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function CareerTab() {
    return (
        <div style={{ padding: "28px 0" }}>
            <div style={cardStyle}>
                <h3 style={sectionTitle}>Career Timeline</h3>
                <div style={{ position: "relative", paddingLeft: "32px" }}>
                    <div style={{ position: "absolute", left: "10px", top: 0, bottom: 0, width: "2px", background: "#e2e8f0" }} />
                    {careerPathways.map((item, i) => (
                        <div key={i} style={{ position: "relative", marginBottom: "28px" }}>
                            <div
                                style={{
                                    position: "absolute",
                                    left: "-27px",
                                    top: "4px",
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "50%",
                                    background: item.color,
                                    border: "2px solid white",
                                    boxShadow: `0 0 0 3px ${item.color}33`,
                                }}
                            />
                            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
                                <span style={{ fontSize: "0.78rem", color: item.color, fontWeight: 700, background: `${item.color}15`, padding: "2px 8px", borderRadius: "10px" }}>
                                    {item.year}
                                </span>
                                <span style={{ fontWeight: 700, color: "#1e293b" }}>{item.role}</span>
                            </div>
                            <div style={{ color: "#64748b", fontSize: "0.88rem" }}>{item.company}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function GalleryTab() {
    const [selected, setSelected] = useState(null);
    return (
        <div style={{ padding: "28px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                {galleryImages.map((img) => (
                    <div
                        key={img.id}
                        onClick={() => setSelected(img)}
                        style={{
                            borderRadius: "12px",
                            height: "160px",
                            background: img.bg,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "flex-end",
                            padding: "12px",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.18)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; }}
                    >
                        <span style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(6px)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, color: "white" }}>
                            {img.label}
                        </span>
                    </div>
                ))}
            </div>
            {selected && (
                <div
                    onClick={() => setSelected(null)}
                    style={{
                        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
                    }}
                >
                    <div style={{ borderRadius: "20px", width: "360px", height: "260px", background: selected.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "white", fontSize: "1.5rem", fontWeight: 700 }}>{selected.label}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function FriendsTab() {
    return (
        <div style={{ padding: "28px 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {friends.map((f) => (
                <div key={f.name} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "12px" }}>
                    <img src={f.avatar} alt={f.name} style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
                    <div>
                        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.92rem" }}>{f.name}</div>
                        <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{f.role}</div>
                    </div>
                    <button
                        style={{
                            marginLeft: "auto",
                            background: "#eff6ff",
                            color: "#3b82f6",
                            border: "none",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Follow
                    </button>
                </div>
            ))}
        </div>
    );
}

const cardStyle = {
    background: "white",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    border: "1px solid #f1f5f9",
};

const sectionTitle = {
    margin: "0 0 18px",
    fontSize: "1rem",
    fontWeight: 700,
    color: "#1e293b",
    letterSpacing: "-0.01em",
};

const tabComponents = {
    About: <AboutTab />,
    "Skills Card": <SkillsTab />,
    Certificates: <CertificatesTab />,
    "Career Pathways": <CareerTab />,
    Gallery: <GalleryTab />,
    Friends: <FriendsTab />,
};

export default function SampleProfilePage() {
    const [activeTab, setActiveTab] = useState("About");

    const user = useUserProfile()
    const userDomain = useUserDomain()

    const activeDomain = userDomain?.activeDomain
    const instructor = user?.instructor || {}
    const student = user?.student || {}
    const admin = user?.admin || {}
    const course_creator = user?.course_creator || {}
    const organisation = user?.organization || {}

    // insstructor example data
    // admin_verified
    // :
    // true
    // bio
    // :
    // "<p>Music is more than a passion — it’s a language I live by. As a lifelong music enthusiast, genre explorer, and sound seeker, I’m constantly diving into new sonic landscapes to uncover the stories and emotions that shape them. From timeless classics to underground experimental sounds, I believe every genre offers a unique heartbeat worth discovering. I love connecting with artists, sharing new discoveries, and exploring how rhythm, melody, and culture intertwine. Whether it’s through deep listening sessions, live performances, or late-night playlist dives, I’m always searching for that next sound that speaks directly to the soul.</p>"
    // created_by
    // :
    // "3ede2548-f668-420d-9105-966c87525e35"
    // created_date
    // :
    // "2025-10-27T05:23:40.341904"
    // formatted_location
    // :
    // "-1.292100, 36.821900"
    // full_name
    // :
    // "Ayomhi Ayo Ayomhi"
    // has_location_coordinates
    // :
    // true
    // is_profile_complete
    // :
    // true
    // latitude
    // :
    // -1.2921
    // longitude
    // :
    // 36.8219
    // professional_headline
    // :
    // "Music Enthusiast | Genre Explorer | Sound Seeker"
    // updated_by
    // :
    // "3ede2548-f668-420d-9105-966c87525e35"
    // updated_date
    // :
    // "2025-11-10T15:39:00.11771"
    // user_uuid
    // :
    // "4d1ae0ad-4092-459a-a534-1d14deedbe5b"
    // uuid
    // :
    // "a95a2c0d-2097-40ae-a4ce-6630111d12d1"
    // website
    // :
    // "https://ayhomi-instructor.com"

    // student example data
    // allGuardianContacts
    // :
    // (2)['Parent Instructor Profile 1 (+254700000003)', 'Parent Instructor Profile 2 (+254700000004)']
    // bio
    // :
    // null
    // created_by
    // :
    // "3ede2548-f668-420d-9105-966c87525e35"
    // created_date
    // :
    // "2026-01-26T14:05:15.051639"
    // demographic_tag
    // :
    // null
    // first_guardian_mobile
    // :
    // "+254700000003"
    // first_guardian_name
    // :
    // "Parent Instructor Profile 1"
    // full_name
    // :
    // "Ayomhi Ayo Ayomhi"
    // primaryGuardianContact
    // :
    // "Parent Instructor Profile 1 (+254700000003)"
    // second_guardian_mobile
    // :
    // "+254700000004"
    // second_guardian_name
    // :
    // "Parent Instructor Profile 2"
    // secondaryGuardianContact
    // :
    // "Parent Instructor Profile 2 (+254700000004)"
    // updated_by
    // :
    // null
    // updated_date
    // :
    // "2026-01-26T14:05:15.046598"
    // user_uuid
    // :
    // "4d1ae0ad-4092-459a-a534-1d14deedbe5b"
    // uuid
    // :
    // "b40af4fb-c06f-4b10-92d1-56741b6ddbd5"


    return (
        <div
            style={{
                height: "80vh",
                fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
                padding: "32px 24px",
            }}
        >
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>
            <div style={{ width: "auto", margin: "0 auto" }}>
                {/* Profile Header Card */}
                <div
                    style={{
                        background: "white",
                        borderRadius: "18px",
                        padding: "28px 32px",
                        border: "1px solid #f1f5f9",
                        marginBottom: "0",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "24px", marginBottom: "24px" }}>
                        {/* Avatar */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            <img
                                src={profileData.avatar}
                                alt="Profile"
                                style={{
                                    width: "90px",
                                    height: "90px",
                                    borderRadius: "14px",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    top: "6px",
                                    right: "6px",
                                    width: "12px",
                                    height: "12px",
                                    background: "#22c55e",
                                    borderRadius: "50%",
                                    border: "2px solid white",
                                }}
                            />
                        </div>

                        {/* Name + Info */}
                        <div style={{ flex: 1 }}>
                            <div className="flex flex-row items-center justify-between" >
                                <h1 style={{ margin: "0 0 8px", fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
                                    {profileData.name}
                                </h1>

                                {user?.instructor?.admin_verified &&
                                    <Badge>Verified Instructor</Badge>
                                }
                            </div>
                            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "14px" }}>
                                {[["💼", profileData.role], ["🚗", profileData.location], ["📌", profileData.region]].map(([icon, text]) => (
                                    <span key={text} style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b", fontSize: "0.85rem" }}>
                                        <span>{icon}</span> {text}
                                    </span>
                                ))}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "6px 24px" }}>
                                {[
                                    ["📞", "Phone:", profileData.phone],
                                    ["✉️", "Email:", profileData.email],
                                    ["🌐", "Website", profileData.website],
                                ].map(([icon, label, val]) => (
                                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
                                        <span>{icon}</span>
                                        <span style={{ color: "#94a3b8" }}>{label}</span>
                                        <span style={{ color: "#334155", fontWeight: 500 }}>{val}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: "10px", display: "inline-block", background: "#f1f5f9", padding: "4px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, color: "#475569", letterSpacing: "0.05em" }}>
                                ID {profileData.id}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: "4px", borderTop: "1px solid #f1f5f9", paddingTop: "16px", flexWrap: "wrap" }}>
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: "8px 18px",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "0.88rem",
                                    fontWeight: activeTab === tab ? 700 : 500,
                                    background: activeTab === tab ? "#3b82f6" : "transparent",
                                    color: activeTab === tab ? "white" : "#64748b",
                                    transition: "all 0.15s ease",
                                    fontFamily: "inherit",
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== tab) {
                                        e.currentTarget.style.background = "#f1f5f9";
                                        e.currentTarget.style.color = "#334155";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== tab) {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.color = "#64748b";
                                    }
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div>{tabComponents[activeTab]}</div>
            </div>
        </div>
    );
}