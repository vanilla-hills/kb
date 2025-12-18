import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Bell,
  BookOpen,
  FileDiff,
  Filter,
  HeartPulse,
  Home,
  KeyRound,
  LayoutGrid,
  LogOut,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  Star,
  Trash2,
  UserCircle,
  Wrench,
  X,
} from "lucide-react";
import { supabase, getProfile } from "@/lib/supabase";
import AuthSplash from "@/components/AuthSplash";

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function KnowledgeBaseDashboard() {
  // ---------- AUTH (Supabase) ----------
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfileState] = useState(null);

  const currentUser = useMemo(() => {
    if (!authUser) return null;
    return {
      name: authUser.user_metadata?.full_name || authUser.email || 'User',
      email: authUser.email,
      role: profile?.role || 'guest',
    };
  }, [authUser, profile]);

  const canEdit = currentUser?.role === 'user' || currentUser?.role === 'admin';
  const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  useEffect(() => {
    let mounted = true;
    async function load() {
      // If the user returned from a magic-link redirect, attempt to parse
      // the auth session from the URL first so the client has the session.
      let session = null;
      try {
        const { data: urlData } = await supabase.auth.getSessionFromUrl();
        session = urlData?.session ?? null;
      } catch (e) {
        // no session in URL — continue
      }

      if (!session) {
        const { data } = await supabase.auth.getSession();
        session = data?.session;
      }
      if (!mounted) return;
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        const p = await getProfile(session.user.id);
        if (mounted) setProfileState(p);
      }
    }
    load();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        const p = await getProfile(session.user.id);
        setProfileState(p);
      } else {
        setProfileState(null);
      }
    });

    return () => {
      mounted = false;
      try {
        listener?.subscription?.unsubscribe();
      } catch (e) {}
    };
  }, []);

  // ---------- NAV ----------
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { key: "favorites", label: "Favorites", icon: Star },
    { key: "all", label: "All Topics", icon: LayoutGrid },
    { key: "justice", label: "Program & Justice", icon: Shield },
    { key: "health", label: "Treatment & Health", icon: HeartPulse },
    { key: "living", label: "Daily Living", icon: Home },
    { key: "staff", label: "Staff Resources", icon: Wrench },
    { key: "policies", label: "Policies & Forms", icon: BookOpen },
  ];

  const bottomNavItems = [{ key: "changes", label: "Change Log", icon: FileDiff }];

  const [activeNav, setActiveNav] = useState("dashboard");
  const [query, setQuery] = useState("");

  // Change log filters
  const [changeQuery, setChangeQuery] = useState("");
  const [changeRoleFilter, setChangeRoleFilter] = useState("all"); // "all" | role
  const [changeCardFilter, setChangeCardFilter] = useState("all");
  const [changeTimeFilter, setChangeTimeFilter] = useState("all"); // all | 24h | 7d | 30d
  const [expandedChange, setExpandedChange] = useState(null);

  // Add Topic modal
  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("justice");

  // Edit Topic modal (whole-card editing)
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editCardTitle, setEditCardTitle] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  // ---------- USER STATES ----------
  const [favorites, setFavorites] = useState([
    "Drug Screening",
    "Orientation & Rules",
    "Transportation & IDs",
  ]);
  const [recent, setRecent] = useState(["Orientation & Rules", "Drug Screening"]);

  // Card view state
  const [pendingNav, setPendingNav] = useState(null); // { title, sectionIndex }
  const [selectedCard, setSelectedCard] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(null);

  // ---------- CARDS (GENERIC SITE DATA) ----------
  const initialCards = [
    // Program & Justice
    {
      title: "Orientation & Rules",
      category: "justice",
      description: "What to expect, rules, incentives, sanctions, and confidentiality.",
    },
    {
      title: "Court & Legal",
      category: "justice",
      description: "Court dates, hearings, paperwork, and what to bring.",
    },
    {
      title: "Probation & Parole",
      category: "justice",
      description: "Reporting, communication expectations, and compliance basics.",
    },
    {
      title: "Drug Screening",
      category: "justice",
      description: "How screens work, missed screens, positives, and confirmation testing.",
    },
    {
      title: "Expungement",
      category: "justice",
      description: "Basic overview, eligibility questions, and where to start.",
    },
    {
      title: "Records & Background Checks",
      category: "justice",
      description: "Criminal record basics, common hurdles, and practical next steps.",
    },

    // Treatment & Health
    {
      title: "Treatment Levels",
      category: "health",
      description: "Outpatient, IOP, residential, MAT, and how referrals work.",
    },
    {
      title: "Medication & MAT",
      category: "health",
      description: "Prescriptions, verification, and how to report changes.",
    },
    {
      title: "Mental Health Crisis",
      category: "health",
      description: "Warning signs, emergency steps, and local crisis options.",
    },
    {
      title: "Overdose Prevention",
      category: "health",
      description: "Naloxone basics, safety planning, and quick response steps.",
    },

    // Daily Living
    {
      title: "Housing & Shelter",
      category: "living",
      description: "Short-term shelter, transitional housing, and stable housing steps.",
    },
    {
      title: "Transportation & IDs",
      category: "living",
      description: "Getting an ID, rides, bus routes, and appointment planning.",
    },
    {
      title: "Employment & Job Readiness",
      category: "living",
      description: "Resumes, interviews, work restrictions, and supportive resources.",
    },
    {
      title: "Budgeting & Benefits",
      category: "living",
      description: "Basic budgeting, SNAP/Medicaid basics, and paperwork tips.",
    },

    // Staff Resources
    {
      title: "Intake Checklist",
      category: "staff",
      description: "Standard intake steps, required releases, and first-week milestones.",
    },
    {
      title: "Case Notes Style Guide",
      category: "staff",
      description: "How to write clear, defensible, and consistent documentation.",
    },
    {
      title: "Court Update Template",
      category: "staff",
      description: "A consistent, court-friendly format for progress updates.",
    },

    // Policies & Forms
    {
      title: "Confidentiality Policy",
      category: "policies",
      description: "What we protect, what we must share, and how disclosures work.",
    },
    {
      title: "Release of Information",
      category: "policies",
      description: "ROI basics, common partners, and how to complete correctly.",
    },
    {
      title: "Grievance Process",
      category: "policies",
      description: "How to report concerns and what the response process looks like.",
    },
  ];

  const [cards, setCards] = useState(initialCards);

  // ---------- CONTENT (GENERIC) ----------
  const initialContent = {
    "Orientation & Rules": {
      title: "Orientation & Program Rules",
      intro:
        "This section covers what to expect in the program, your first-week steps, rules that keep everyone safe, and how progress is recognized.",
      sections: [
        {
          heading: "Program Overview & Mission",
          body:
            "The program supports justice-involved individuals as they stabilize, meet court requirements, and build a sustainable plan for life in the community. The mission is accountability plus support, not just monitoring.",
          subsections: [
            {
              subheading: "Mission Statement",
              body:
                "We provide structured accountability and practical support so participants can reduce risk, improve stability, and build a path forward.",
            },
            {
              subheading: "What Success Looks Like",
              body:
                "Consistent attendance, honest communication, reduced risk behaviors, treatment engagement, stable housing, and progress on court requirements.",
            },
          ],
        },
        {
          heading: "Your First Week: What to Expect",
          body:
            "Most people complete orientation paperwork, releases of information, initial screening, schedule planning, and a rules review. Staff also discuss immediate needs and safety concerns.",
          subsections: [
            {
              subheading: "Bring With You",
              body:
                "Any court paperwork, medication list, a phone number you can be reached at, and any important contact information.",
            },
            {
              subheading: "Initial Schedule",
              body:
                "You will receive a schedule for groups, check-ins, and screening expectations, including what to do if an emergency impacts attendance.",
            },
          ],
        },
        {
          heading: "Rules & Expectations",
          body:
            "Expectations typically include attendance, respectful behavior, drug screening participation, honesty with staff, and following instructions related to safety and court compliance.",
        },
        {
          heading: "Incentives & Sanctions",
          body:
            "Progress is recognized through incentives (praise in court, reduced reporting, privileges). Rule violations can lead to responses such as additional check-ins, added groups, or court sanctions, depending on patterns and safety.",
        },
        {
          heading: "Confidentiality & Limits",
          body:
            "We protect your information within legal and program rules. Some information must be reported when safety is at risk, new criminal behavior occurs, or the court/supervision requires updates.",
        },
      ],
    },

    "Drug Screening": {
      title: "Drug Screening Process & Expectations",
      intro:
        "This section explains how drug screening works, what happens with missed or refused screens, and how results are reviewed.",
      sections: [
        {
          heading: "Overview",
          body:
            "Drug screening supports safety, honesty, and court/supervision requirements. Screens may be scheduled, random, or requested based on supervision needs.",
          subsections: [
            {
              subheading: "When Screens Happen",
              body:
                "Screens may occur during check-in, before/after group, or randomly. The program will explain the notification process and timelines.",
            },
            {
              subheading: "Observed vs. Unobserved",
              body:
                "Some screens may be observed to prevent tampering. Staff should explain expectations clearly and treat the process respectfully.",
            },
          ],
        },
        {
          heading: "General Panel",
          body:
            "The standard panel usually includes common substances (examples: opioids, benzodiazepines, stimulants, THC, and alcohol indicators). Results are interpreted with prescriptions and clinical context.",
        },
        {
          heading: "Confirmation / Expanded Testing",
          body:
            "If a result is unclear or more detail is needed, confirmatory or expanded testing may be requested through a lab partner.",
          subsections: [
            {
              subheading: "When We Confirm",
              body:
                "Examples include disputed results, unusual findings, or when the court requests more detailed documentation.",
            },
            {
              subheading: "What Changes",
              body:
                "Confirmatory testing can provide more specific information than an on-site panel. Staff should document the reason for sending.",
            },
          ],
        },
        {
          heading: "Missed / Refused / Tampered Screens",
          body:
            "Missed, refused, or obviously tampered screens are typically treated as positive. Staff document what happened and follow the program’s reporting requirements.",
        },
        {
          heading: "If a Screen Is Positive",
          body:
            "A positive screen is reviewed with the participant. Responses may include increased treatment, tighter monitoring, safety planning, or court action depending on pattern, risk, and policy.",
        },
      ],
    },

    "Housing & Shelter": {
      title: "Housing & Shelter",
      intro: "This section includes short-term shelter basics and steps toward stable housing.",
      sections: [
        {
          heading: "Short-Term Options",
          body:
            "Short-term shelter availability changes. Staff can help identify local options and plan transportation. Keep a backup plan for nights when space is limited.",
        },
        {
          heading: "Steps Toward Stability",
          body:
            "Focus on ID, income, a basic budget, and documentation. Many housing programs require proof of engagement and consistent follow-through.",
        },
      ],
    },

    "Transportation & IDs": {
      title: "Transportation & IDs",
      intro:
        "This section covers how people usually get an ID and how to plan transportation so appointments aren’t missed.",
      sections: [
        {
          heading: "Getting an ID",
          body:
            "Most people need basic documents (birth certificate, social security card, proof of address). Staff can help you make a document checklist and plan the steps.",
        },
        {
          heading: "Transportation Planning",
          body:
            "Plan rides early. Use reminders. Build buffer time for delays. Keep a short list of backup contacts for emergencies.",
        },
      ],
    },

    "Intake Checklist": {
      title: "Intake Checklist",
      intro: "This staff-focused section outlines a consistent first-contact intake flow.",
      sections: [
        {
          heading: "Core Intake Steps",
          body:
            "Confirm referral source, verify basic identity, gather key collateral contacts, review immediate risks, complete required releases, schedule first-week requirements.",
        },
        {
          heading: "First-Week Milestones",
          body:
            "Orientation complete, schedule provided, screening expectations reviewed, treatment referral initiated if needed, court communication expectations clarified.",
        },
      ],
    },

    "Confidentiality Policy": {
      title: "Confidentiality Policy",
      intro:
        "This section describes what information is protected and the common limits that apply in justice settings.",
      sections: [
        {
          heading: "What We Protect",
          body:
            "Personal details are handled with care and shared only as permitted by policy, release of information, and legal requirements.",
        },
        {
          heading: "Common Limits",
          body:
            "Safety concerns, mandatory reporting rules, and court/supervision requirements can limit confidentiality. Staff should review these clearly at orientation.",
        },
      ],
    },
  };

  const [contentByTitle, setContentByTitle] = useState(initialContent);

  const ensureArticle = useCallback(
    (title) => {
      if (contentByTitle[title]) return;
      setContentByTitle((prev) => ({
        ...prev,
        [title]: {
          title,
          intro: "(Add an intro)",
          sections: [{ heading: "Overview", body: "(Add content)", subsections: [] }],
        },
      }));
    },
    [contentByTitle]
  );

  const [changeLog, setChangeLog] = useState([
    {
      id: makeId(),
      at: Date.now() - 1000 * 60 * 45,
      user: "Admin",
      role: "admin",
      cardTitle: "Confidentiality Policy",
      sectionHeading: "Common Limits",
      field: "section.body",
      before:
        "Safety concerns, mandatory reporting rules, and court/supervision requirements can limit confidentiality.",
      after:
        "Safety concerns, mandatory reporting rules, and court/supervision requirements can limit confidentiality. Staff should review these clearly at orientation.",
    },
  ]);

  // ---------- HELPERS ----------
  const toggleFavorite = (title) => {
    setFavorites((prev) =>
      prev.includes(title) ? prev.filter((f) => f !== title) : [...prev, title]
    );
  };

  const pushRecent = useCallback((title) => {
    setRecent((prev) => [title, ...prev.filter((x) => x !== title)].slice(0, 5));
  }, []);

  const getCategoryForTitle = (title) => {
    const item = cards.find((c) => c.title === title);
    return item ? item.category : null;
  };

  const setSelectionAndScroll = useCallback(
    (title, sectionIndex, shouldScroll = false) => {
      pushRecent(title);
      setSelectedCard(title);
      setSelectedSectionIndex(sectionIndex);

      if (!shouldScroll) return;

      requestAnimationFrame(() => {
        const el = document.getElementById(`card-${slugify(title)}`);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const topPad = 96;
        const bottomPad = 96;
        const outOfView = rect.top < topPad || rect.bottom > window.innerHeight - bottomPad;

        if (outOfView) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    },
    [pushRecent]
  );

  const openCard = useCallback(
    (title, sectionIndex = null, shouldScroll = false) => {
      ensureArticle(title);
      setExpandedCard(title);
      setSelectionAndScroll(title, sectionIndex, shouldScroll);
    },
    [ensureArticle, setSelectionAndScroll]
  );

  const handleCardClick = (title) => {
    if (editOpen) return;
    ensureArticle(title);
    setExpandedCard((prev) => (prev === title ? null : title));
    setSelectionAndScroll(title, null, false);
  };

  const goToCard = (title, sectionIndex = null) => {
    setQuery("");
    const cat = getCategoryForTitle(title);
    setActiveNav(cat ?? "all");
    setPendingNav({ title, sectionIndex });
  };

  // ---------- ADD TOPIC ----------
  const openAddTopic = () => {
    if (!canEdit) return;
    const cat =
      activeNav === "justice" ||
      activeNav === "health" ||
      activeNav === "living" ||
      activeNav === "staff" ||
      activeNav === "policies"
        ? activeNav
        : "justice";

    setNewTopicCategory(cat);
    setNewTopicTitle("");
    setNewTopicDescription("");
    setAddTopicOpen(true);
  };

  const createTopic = () => {
    if (!canEdit) return;
    const title = newTopicTitle.trim();
    if (!title) return;

    if (cards.some((c) => c.title.toLowerCase() === title.toLowerCase())) {
      window.alert("A topic with that title already exists.");
      return;
    }

    const newItem = {
      title,
      category: newTopicCategory,
      description: newTopicDescription.trim() || "(Add a description)",
    };

    setCards((prev) => [...prev, newItem]);
    setContentByTitle((prev) => ({
      ...prev,
      [title]: {
        title,
        intro: "(Add an intro)",
        sections: [{ heading: "Overview", body: "(Add content)", subsections: [] }],
      },
    }));

    setAddTopicOpen(false);
    setActiveNav(newTopicCategory);
    setPendingNav({ title, sectionIndex: 0 });
  };

  // ---------- EDIT TOPIC (WHOLE CARD) ----------
  const openEditCard = (title) => {
    if (!canEdit) return;
    ensureArticle(title);

    const card = cards.find((c) => c.title === title);
    const art = contentByTitle[title];

    if (!card) {
      setEditError("Failed to edit knowledge base (missing card). ");
      return;
    }

    const safeArt =
      art ??
      ({
        title,
        intro: "(Add an intro)",
        sections: [{ heading: "Overview", body: "(Add content)", subsections: [] }],
      });

    setEditError(null);
    setEditCardTitle(title);
    setEditDraft({
      cardTitle: card.title,
      description: card.description,
      articleTitle: safeArt.title,
      intro: safeArt.intro,
      sections: (safeArt.sections ?? []).map((s) => ({
        heading: s.heading,
        body: s.body,
        subsections: (s.subsections ?? []).map((sub) => ({ ...sub })),
      })),
    });
    setEditOpen(true);
  };

  const closeEditCard = () => {
    setEditOpen(false);
    setEditCardTitle(null);
    setEditDraft(null);
    setEditError(null);
    setEditSaving(false);
  };

  const isEditDirty = () => {
    if (!editCardTitle || !editDraft) return false;
    const card = cards.find((c) => c.title === editCardTitle);
    const art = contentByTitle[editCardTitle];
    if (!card || !art) return false;

    if (editDraft.cardTitle !== card.title) return true;
    if (editDraft.description !== card.description) return true;
    if (editDraft.articleTitle !== art.title) return true;
    if (editDraft.intro !== art.intro) return true;

    const aSecs = art.sections ?? [];
    const dSecs = editDraft.sections ?? [];
    if (aSecs.length !== dSecs.length) return true;

    for (let i = 0; i < dSecs.length; i++) {
      const a = aSecs[i];
      const d = dSecs[i];
      if (!a || !d) return true;
      if ((d.heading ?? "") !== (a.heading ?? "")) return true;
      if ((d.body ?? "") !== (a.body ?? "")) return true;
      const aSubs = a.subsections ?? [];
      const dSubs = d.subsections ?? [];
      if (aSubs.length !== dSubs.length) return true;
      for (let j = 0; j < dSubs.length; j++) {
        const as = aSubs[j];
        const ds = dSubs[j];
        if (!as || !ds) return true;
        if ((ds.subheading ?? "") !== (as.subheading ?? "")) return true;
        if ((ds.body ?? "") !== (as.body ?? "")) return true;
      }
    }

    return false;
  };

  const saveEditCard = () => {
    if (!canEdit) return;
    if (!editCardTitle || !editDraft) return;

    setEditSaving(true);
    setEditError(null);

    const oldTitle = editCardTitle;
    const nextTitle = editDraft.cardTitle.trim() || oldTitle;

    // Prevent duplicates on rename
    if (
      nextTitle.toLowerCase() !== oldTitle.toLowerCase() &&
      cards.some((c) => c.title.toLowerCase() === nextTitle.toLowerCase())
    ) {
      setEditSaving(false);
      setEditError("A topic with that title already exists.");
      return;
    }

    const prevCard = cards.find((c) => c.title === oldTitle);
    const prevArt = contentByTitle[oldTitle];
    if (!prevCard || !prevArt) {
      setEditSaving(false);
      setEditError("Failed to save edits (missing original content). ");
      return;
    }

    const newEntries = [];

    if (nextTitle !== prevCard.title) {
      newEntries.push({
        id: makeId(),
        at: Date.now(),
        user: currentUser.name,
        role: currentUser.role,
        cardTitle: nextTitle,
        sectionHeading: "(Card)",
        field: "card.title",
        before: prevCard.title,
        after: nextTitle,
      });
    }

    if ((editDraft.description ?? "") !== (prevCard.description ?? "")) {
      newEntries.push({
        id: makeId(),
        at: Date.now(),
        user: currentUser.name,
        role: currentUser.role,
        cardTitle: nextTitle,
        sectionHeading: "(Card)",
        field: "card.description",
        before: prevCard.description ?? "",
        after: editDraft.description ?? "",
      });
    }

    if ((editDraft.articleTitle ?? "") !== (prevArt.title ?? "")) {
      newEntries.push({
        id: makeId(),
        at: Date.now(),
        user: currentUser.name,
        role: currentUser.role,
        cardTitle: nextTitle,
        sectionHeading: "(Card)",
        field: "article.title",
        before: prevArt.title ?? "",
        after: editDraft.articleTitle ?? "",
      });
    }

    if ((editDraft.intro ?? "") !== (prevArt.intro ?? "")) {
      newEntries.push({
        id: makeId(),
        at: Date.now(),
        user: currentUser.name,
        role: currentUser.role,
        cardTitle: nextTitle,
        sectionHeading: "(Card)",
        field: "article.intro",
        before: prevArt.intro ?? "",
        after: editDraft.intro ?? "",
      });
    }

    const prevSecs = prevArt.sections ?? [];
    const nextSecs = editDraft.sections ?? [];

    if (prevSecs.length !== nextSecs.length) {
      newEntries.push({
        id: makeId(),
        at: Date.now(),
        user: currentUser.name,
        role: currentUser.role,
        cardTitle: nextTitle,
        sectionHeading: "(Sections)",
        field: prevSecs.length < nextSecs.length ? "section.add" : "section.remove",
        before: String(prevSecs.length),
        after: String(nextSecs.length),
      });
    }

    const maxS = Math.max(prevSecs.length, nextSecs.length);
    for (let i = 0; i < maxS; i++) {
      const p = prevSecs[i];
      const n = nextSecs[i];
      if (!p || !n) continue;

      if ((p.heading ?? "") !== (n.heading ?? "")) {
        newEntries.push({
          id: makeId(),
          at: Date.now(),
          user: currentUser.name,
          role: currentUser.role,
          cardTitle: nextTitle,
          sectionHeading: p.heading,
          field: "section.heading",
          before: p.heading ?? "",
          after: n.heading ?? "",
        });
      }

      if ((p.body ?? "") !== (n.body ?? "")) {
        newEntries.push({
          id: makeId(),
          at: Date.now(),
          user: currentUser.name,
          role: currentUser.role,
          cardTitle: nextTitle,
          sectionHeading: n.heading,
          field: "section.body",
          before: p.body ?? "",
          after: n.body ?? "",
        });
      }

      const pSubs = p.subsections ?? [];
      const nSubs = n.subsections ?? [];

      if (pSubs.length !== nSubs.length) {
        newEntries.push({
          id: makeId(),
          at: Date.now(),
          user: currentUser.name,
          role: currentUser.role,
          cardTitle: nextTitle,
          sectionHeading: n.heading,
          field: pSubs.length < nSubs.length ? "subsection.add" : "subsection.remove",
          before: String(pSubs.length),
          after: String(nSubs.length),
        });
      }

      const maxSub = Math.max(pSubs.length, nSubs.length);
      for (let j = 0; j < maxSub; j++) {
        const ps = pSubs[j];
        const ns = nSubs[j];
        if (!ps || !ns) continue;

        if ((ps.subheading ?? "") !== (ns.subheading ?? "")) {
          newEntries.push({
            id: makeId(),
            at: Date.now(),
            user: currentUser.name,
            role: currentUser.role,
            cardTitle: nextTitle,
            sectionHeading: n.heading,
            subsectionHeading: ps.subheading,
            field: "subsection.subheading",
            before: ps.subheading ?? "",
            after: ns.subheading ?? "",
          });
        }

        if ((ps.body ?? "") !== (ns.body ?? "")) {
          newEntries.push({
            id: makeId(),
            at: Date.now(),
            user: currentUser.name,
            role: currentUser.role,
            cardTitle: nextTitle,
            sectionHeading: n.heading,
            subsectionHeading: ns.subheading,
            field: "subsection.body",
            before: ps.body ?? "",
            after: ns.body ?? "",
          });
        }
      }
    }

    // Apply card updates
    setCards((prev) =>
      prev.map((c) =>
        c.title === oldTitle
          ? { ...c, title: nextTitle, description: editDraft.description }
          : c
      )
    );

    // Apply article updates (and rename key if needed)
    setContentByTitle((prev) => {
      const nextArticle = {
        title: editDraft.articleTitle,
        intro: editDraft.intro,
        sections: editDraft.sections.map((s) => ({
          heading: s.heading,
          body: s.body,
          subsections: s.subsections.length ? s.subsections : undefined,
        })),
      };

      if (nextTitle === oldTitle) {
        return { ...prev, [oldTitle]: nextArticle };
      }

      const { [oldTitle]: _, ...rest } = prev;
      return { ...rest, [nextTitle]: nextArticle };
    });

    // Rename references for prototype convenience
    if (nextTitle !== oldTitle) {
      setFavorites((prev) => prev.map((t) => (t === oldTitle ? nextTitle : t)));
      setRecent((prev) => prev.map((t) => (t === oldTitle ? nextTitle : t)));
      setSelectedCard((p) => (p === oldTitle ? nextTitle : p));
      setExpandedCard((p) => (p === oldTitle ? nextTitle : p));
      setPendingNav((p) => (p && p.title === oldTitle ? { ...p, title: nextTitle } : p));
      setChangeLog((prev) =>
        prev.map((e) => (e.cardTitle === oldTitle ? { ...e, cardTitle: nextTitle } : e))
      );
    }

    if (newEntries.length) setChangeLog((prev) => [...newEntries, ...prev]);

    setEditSaving(false);
    closeEditCard();
  };

  // ---------- FILTERED CARDS ----------
  const filteredCards = useMemo(() => {
    const raw = query.trim().toLowerCase();
    const tokens = raw ? raw.split(" ").filter(Boolean) : [];

    const matches = (haystack) =>
      tokens.length === 0 ? true : tokens.every((t) => haystack.includes(t));

    return cards.filter((c) => {
      if (activeNav === "dashboard" || activeNav === "changes") return false;

      const navOk =
        activeNav === "all"
          ? true
          : activeNav === "favorites"
            ? favorites.includes(c.title)
            : c.category === activeNav;

      if (!navOk) return false;
      if (tokens.length === 0) return true;

      const article = contentByTitle[c.title];
      let haystack = (c.title + " " + c.description).toLowerCase();

      if (article) {
        haystack += " " + (article.title || "") + " " + (article.intro || "");
        for (const s of article.sections || []) {
          haystack += " " + (s.heading || "") + " " + (s.body || "");
          for (const sub of s.subsections || []) {
            haystack += " " + (sub.subheading || "") + " " + (sub.body || "");
          }
        }
      }

      return matches(haystack);
    });
  }, [activeNav, query, favorites, cards, contentByTitle]);

  useEffect(() => {
    if (!pendingNav) return;
    const exists = filteredCards.some((c) => c.title === pendingNav.title);
    if (!exists) return;
    openCard(pendingNav.title, pendingNav.sectionIndex, true);
    setPendingNav(null);
  }, [pendingNav, filteredCards, openCard]);

  // ---------- CHANGE LOG FILTERS ----------
  const changeCardOptions = useMemo(() => {
    return Array.from(new Set(changeLog.map((e) => e.cardTitle))).sort();
  }, [changeLog]);

  const filteredChangeLog = useMemo(() => {
    const q = changeQuery.trim().toLowerCase();
    const now = Date.now();

    const roleOk = (e) => (changeRoleFilter === "all" ? true : e.role === changeRoleFilter);
    const cardOk = (e) => (changeCardFilter === "all" ? true : e.cardTitle === changeCardFilter);

    const timeOk = (e) => {
      if (changeTimeFilter === "all") return true;
      const age = now - e.at;
      if (changeTimeFilter === "24h") return age <= 1000 * 60 * 60 * 24;
      if (changeTimeFilter === "7d") return age <= 1000 * 60 * 60 * 24 * 7;
      return age <= 1000 * 60 * 60 * 24 * 30;
    };

    const base = changeLog.filter((e) => roleOk(e) && cardOk(e) && timeOk(e));

    if (!q) return base;
    const tokens = q.split(" ").filter(Boolean);
    const matches = (s) => tokens.every((t) => s.includes(t));

    return base.filter((e) => {
      const hay = (
        e.user +
        " " +
        e.role +
        " " +
        e.cardTitle +
        " " +
        e.sectionHeading +
        " " +
        (e.subsectionHeading ?? "") +
        " " +
        e.field +
        " " +
        e.before +
        " " +
        e.after
      ).toLowerCase();
      return matches(hay);
    });
  }, [changeLog, changeQuery, changeRoleFilter, changeCardFilter, changeTimeFilter]);

  if (!authUser) return <AuthSplash />;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-blue-400">DRC Wiki</h1>
          <p className="text-xs text-slate-500 mt-1">Browse by category</p>

          {/* Mobile: compact grid. Desktop: stacked list */}
          <nav className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  className={`rounded-lg border p-2 hover:bg-slate-800 transition flex flex-col items-center justify-center text-center leading-tight min-h-[3.25rem] md:min-h-0 md:flex-row md:justify-start md:text-left md:gap-2 ${
                    isActive ? "bg-slate-800 border-slate-700" : "border-transparent"
                  }`}
                  onClick={() => setActiveNav(item.key)}
                >
                  <Icon size={18} className={isActive ? "text-blue-300" : "text-slate-300"} />
                  <span className="text-[11px] md:text-sm mt-1 md:mt-0">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-col">
          <button className="flex items-center justify-center md:justify-start gap-2 p-2 rounded hover:bg-slate-800">
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Bottom nav */}
        <nav className="grid grid-cols-3 gap-2 md:grid-cols-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.key;
            return (
              <button
                key={item.key}
                className={`rounded-lg border p-2 hover:bg-slate-800 transition flex flex-col items-center justify-center text-center leading-tight min-h-[3.25rem] md:min-h-0 md:flex-row md:justify-start md:text-left md:gap-2 ${
                  isActive ? "bg-slate-800 border-slate-700" : "border-transparent"
                }`}
                onClick={() => setActiveNav(item.key)}
              >
                <Icon size={18} className={isActive ? "text-blue-300" : "text-slate-300"} />
                <span className="text-[11px] md:text-sm mt-1 md:mt-0">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* Add Topic Modal */}
        {addTopicOpen ? (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setAddTopicOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-100">Add Topic</div>
                  <div className="text-xs text-slate-400 mt-1">Creates a new card (prototype only).</div>
                </div>
                <button
                  className="p-2 rounded-lg border border-slate-700 bg-slate-900/40 hover:border-slate-500"
                  onClick={() => setAddTopicOpen(false)}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Title</div>
                  <Input
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    className="bg-slate-900/40 border-slate-700 text-slate-100"
                    placeholder="New topic title"
                  />
                </div>

                <div>
                  <div className="text-xs text-slate-400 mb-1">Description</div>
                  <Input
                    value={newTopicDescription}
                    onChange={(e) => setNewTopicDescription(e.target.value)}
                    className="bg-slate-900/40 border-slate-700 text-slate-100"
                    placeholder="Short one-line summary"
                  />
                </div>

                <div>
                  <div className="text-xs text-slate-400 mb-1">Category</div>
                  <select
                    value={newTopicCategory}
                    onChange={(e) => setNewTopicCategory(e.target.value)}
                    className="w-full text-sm rounded-lg bg-slate-900/40 border border-slate-700 px-3 py-2 text-slate-100"
                  >
                    <option value="justice">Program & Justice</option>
                    <option value="health">Treatment & Health</option>
                    <option value="living">Daily Living</option>
                    <option value="staff">Staff Resources</option>
                    <option value="policies">Policies & Forms</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    className="text-sm px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/40 hover:border-slate-500"
                    onClick={() => setAddTopicOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="text-sm px-3 py-2 rounded-lg border border-blue-400 bg-blue-500/10 text-blue-300 hover:text-blue-200"
                    onClick={createTopic}
                  >
                    Create Topic
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Edit Topic Modal */}
        {editOpen && editDraft ? (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => {
              if (isEditDirty()) {
                const ok = window.confirm("Discard your unsaved edits?");
                if (!ok) return;
              }
              closeEditCard();
            }}
          >
            <div
              className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-100">Edit Topic</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Edits the entire card, sections, and subsections.
                  </div>
                </div>
                <button
                  className="p-2 rounded-lg border border-slate-700 bg-slate-900/40 hover:border-slate-500"
                  onClick={() => {
                    if (isEditDirty()) {
                      const ok = window.confirm("Discard your unsaved edits?");
                      if (!ok) return;
                    }
                    closeEditCard();
                  }}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {editError ? <div className="mt-3 text-sm text-red-300">{editError}</div> : null}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Card Title</div>
                  <Input
                    value={editDraft.cardTitle}
                    onChange={(e) => setEditDraft((p) => (p ? { ...p, cardTitle: e.target.value } : p))}
                    className="bg-slate-900/40 border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Card Description</div>
                  <Input
                    value={editDraft.description}
                    onChange={(e) => setEditDraft((p) => (p ? { ...p, description: e.target.value } : p))}
                    className="bg-slate-900/40 border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Article Title</div>
                  <Input
                    value={editDraft.articleTitle}
                    onChange={(e) => setEditDraft((p) => (p ? { ...p, articleTitle: e.target.value } : p))}
                    className="bg-slate-900/40 border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Intro</div>
                  <Input
                    value={editDraft.intro}
                    onChange={(e) => setEditDraft((p) => (p ? { ...p, intro: e.target.value } : p))}
                    className="bg-slate-900/40 border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-100">Sections</div>
                  <button
                    className="text-xs px-2 py-1 rounded-lg bg-slate-900/40 border border-slate-700 hover:border-blue-400 hover:text-blue-300 inline-flex items-center gap-2"
                    onClick={() => {
                      setEditDraft((p) =>
                        p
                          ? {
                              ...p,
                              sections: [
                                ...p.sections,
                                { heading: "New Section", body: "(Add content)", subsections: [] },
                              ],
                            }
                          : p
                      );
                    }}
                    title="Add a section"
                  >
                    <Plus size={14} /> Add Section
                  </button>
                </div>

                <div className="mt-3 max-h-[55vh] overflow-y-auto pr-1 space-y-3">
                  {editDraft.sections.map((s, sIdx) => (
                    <div key={sIdx} className="rounded-xl bg-slate-900/30 border border-slate-800 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          value={s.heading}
                          onChange={(e) =>
                            setEditDraft((p) => {
                              if (!p) return p;
                              const next = [...p.sections];
                              next[sIdx] = { ...next[sIdx], heading: e.target.value };
                              return { ...p, sections: next };
                            })
                          }
                          className="bg-slate-900/40 border-slate-700 text-slate-100"
                          placeholder="Section heading"
                        />
                        <button
                          className="p-2 rounded-lg border border-slate-700 bg-slate-900/40 hover:border-red-400"
                          onClick={() => {
                            const ok = window.confirm("Remove this section?");
                            if (!ok) return;
                            setEditDraft((p) => {
                              if (!p) return p;
                              const next = p.sections.filter((_, i) => i !== sIdx);
                              return {
                                ...p,
                                sections: next.length
                                  ? next
                                  : [{ heading: "Overview", body: "(Add content)", subsections: [] }],
                              };
                            });
                          }}
                          title="Remove section"
                        >
                          <Trash2 size={16} className="text-slate-200" />
                        </button>
                      </div>

                      <textarea
                        className="w-full mt-2 rounded-lg bg-slate-900/40 border border-slate-700 p-2 text-sm text-slate-100 focus:outline-none focus:border-blue-400"
                        rows={4}
                        value={s.body}
                        onChange={(e) =>
                          setEditDraft((p) => {
                            if (!p) return p;
                            const next = [...p.sections];
                            next[sIdx] = { ...next[sIdx], body: e.target.value };
                            return { ...p, sections: next };
                          })
                        }
                      />

                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-slate-200">Subsections</div>
                          <button
                            className="text-xs px-2 py-1 rounded-lg bg-slate-900/40 border border-slate-700 hover:border-blue-400 hover:text-blue-300 inline-flex items-center gap-2"
                            onClick={() => {
                              setEditDraft((p) => {
                                if (!p) return p;
                                const next = [...p.sections];
                                const subs = [...(next[sIdx].subsections ?? [])];
                                subs.push({ subheading: "New Subsection", body: "(Add content)" });
                                next[sIdx] = { ...next[sIdx], subsections: subs };
                                return { ...p, sections: next };
                              });
                            }}
                            title="Add a subsection"
                          >
                            <Plus size={14} /> Add Subsection
                          </button>
                        </div>

                        <div className="mt-2 space-y-2">
                          {(s.subsections ?? []).map((sub, subIdx) => (
                            <div key={subIdx} className="rounded-lg bg-slate-950/40 border border-slate-800 p-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={sub.subheading}
                                  onChange={(e) =>
                                    setEditDraft((p) => {
                                      if (!p) return p;
                                      const next = [...p.sections];
                                      const subs = [...(next[sIdx].subsections ?? [])];
                                      subs[subIdx] = { ...subs[subIdx], subheading: e.target.value };
                                      next[sIdx] = { ...next[sIdx], subsections: subs };
                                      return { ...p, sections: next };
                                    })
                                  }
                                  className="bg-slate-900/40 border-slate-700 text-slate-100"
                                  placeholder="Subheading"
                                />
                                <button
                                  className="p-2 rounded-lg border border-slate-700 bg-slate-900/40 hover:border-red-400"
                                  onClick={() => {
                                    const ok = window.confirm("Remove this subsection?");
                                    if (!ok) return;
                                    setEditDraft((p) => {
                                      if (!p) return p;
                                      const next = [...p.sections];
                                      const subs = [...(next[sIdx].subsections ?? [])].filter((_, i) => i !== subIdx);
                                      next[sIdx] = { ...next[sIdx], subsections: subs };
                                      return { ...p, sections: next };
                                    });
                                  }}
                                  title="Remove subsection"
                                >
                                  <Trash2 size={16} className="text-slate-200" />
                                </button>
                              </div>
                              <textarea
                                className="w-full mt-2 rounded-lg bg-slate-900/40 border border-slate-700 p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-400"
                                rows={3}
                                value={sub.body}
                                onChange={(e) =>
                                  setEditDraft((p) => {
                                    if (!p) return p;
                                    const next = [...p.sections];
                                    const subs = [...(next[sIdx].subsections ?? [])];
                                    subs[subIdx] = { ...subs[subIdx], body: e.target.value };
                                    next[sIdx] = { ...next[sIdx], subsections: subs };
                                    return { ...p, sections: next };
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  className="text-sm px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/40 hover:border-slate-500"
                  onClick={() => {
                    if (isEditDirty()) {
                      const ok = window.confirm("Discard your unsaved edits?");
                      if (!ok) return;
                    }
                    closeEditCard();
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`text-sm px-3 py-2 rounded-lg border inline-flex items-center gap-2 ${
                    isEditDirty()
                      ? "border-blue-400 bg-blue-500/10 text-blue-300 hover:text-blue-200"
                      : "border-slate-800 bg-slate-900/20 text-slate-500 cursor-not-allowed"
                  }`}
                  disabled={!isEditDirty() || editSaving}
                  onClick={saveEditCard}
                  title={isEditDirty() ? "Save edits" : "No changes to save"}
                >
                  <Save size={16} /> Save
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Header */}
        {activeNav === "dashboard" ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-blue-300">Dashboard</h2>
              <p className="text-sm text-slate-400 mt-1">
                Admin-managed announcements and quick links, plus your personal recently viewed history.
              </p>
            </div>
          </div>
        ) : activeNav === "changes" ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-blue-300">Change Log</h2>
              <p className="text-sm text-slate-400 mt-1">
                Track edits across the knowledge base (who changed what, and when).
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 rounded px-3 py-2 w-full md:w-1/2">
              <Filter size={18} className="text-slate-400" />
              <Input
                value={changeQuery}
                onChange={(e) => setChangeQuery(e.target.value)}
                className="flex-1 min-w-0 w-full bg-transparent border-0 text-slate-100 placeholder-slate-400 focus:ring-0"
                placeholder="Filter changes..."
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div className="flex items-center gap-2 bg-slate-800 rounded px-3 py-2 w-full md:w-1/2">
              <Search size={18} className="text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 min-w-0 w-full bg-transparent border-0 text-slate-100 placeholder-slate-400 focus:ring-0"
                placeholder="Search topics or keywords..."
              />
            </div>
          </div>
        )}

        {/* DASHBOARD */}
        {activeNav === "dashboard" ? (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-slate-800 border border-slate-800 rounded-2xl shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell size={18} className="text-blue-300" />
                  <h3 className="text-base font-semibold text-slate-100">Announcements</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="p-2 rounded bg-slate-900/40 border border-slate-800">
                    <div className="text-slate-200 font-medium">Updated court update template</div>
                    <div className="text-slate-400 text-xs mt-0.5">Placeholder: add announcements from Admin later.</div>
                  </li>
                  <li className="p-2 rounded bg-slate-900/40 border border-slate-800">
                    <div className="text-slate-200 font-medium">Holiday schedule reminder</div>
                    <div className="text-slate-400 text-xs mt-0.5">Placeholder: program closure dates and coverage info.</div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border border-slate-800 rounded-2xl shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={18} className="text-yellow-400" />
                  <h3 className="text-base font-semibold text-slate-100">Quick Links</h3>
                </div>
                <p className="text-xs text-slate-400 mb-3">Admin-managed shortcuts to high-use topics.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Orientation & Rules",
                    "Drug Screening",
                    "Intake Checklist",
                    "Court Update Template",
                    "Release of Information",
                    "Confidentiality Policy",
                  ].map((t) => (
                    <button
                      key={t}
                      className="p-2 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-200 hover:border-blue-400 hover:text-blue-300 text-left text-sm"
                      onClick={() => goToCard(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border border-slate-800 rounded-2xl shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Search size={18} className="text-slate-300" />
                  <h3 className="text-base font-semibold text-slate-100">Recently Viewed</h3>
                </div>
                <p className="text-xs text-slate-400 mb-3">Your last 5 viewed topics (placeholder: per-user history later).</p>
                <ul className="space-y-1">
                  {recent.length ? (
                    recent.map((t) => (
                      <li key={t}>
                        <button
                          className="w-full px-2 py-1.5 rounded text-slate-200 hover:bg-slate-700 hover:text-slate-100 text-left text-sm"
                          onClick={() => goToCard(t)}
                        >
                          {t}
                        </button>
                      </li>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">No recent activity yet.</div>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border border-slate-800 rounded-2xl shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings size={18} className="text-slate-300" />
                  <h3 className="text-base font-semibold text-slate-100">Account</h3>
                </div>
                <div className="text-sm text-slate-300 space-y-2">
                  <div className="rounded bg-slate-900/40 border border-slate-800 p-3">
                    <div className="text-xs text-slate-400">Profile</div>
                    <div className="mt-1">
                      Name: <span className="text-slate-100">{currentUser.name}</span>
                    </div>
                    <div>
                      Email: <span className="text-slate-100">{currentUser.email}</span>
                    </div>
                    <div>
                      Role: <span className="text-slate-100">{currentUser.role}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">Placeholder: profile editing UI later.</div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-800 hover:border-blue-400 hover:text-blue-300">
                    <KeyRound size={16} /> Change Password
                  </button>

                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-800 hover:border-blue-400 hover:text-blue-300">
                    <UserCircle size={16} /> Edit Profile
                  </button>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {/* CHANGE LOG */}
        {activeNav === "changes" ? (
          <section className="max-w-5xl">
            <div className="text-xs text-slate-500 mb-3">
              Showing {filteredChangeLog.length} change{filteredChangeLog.length === 1 ? "" : "s"}
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 mr-1">Role:</span>
                {["all", "staff", "admin", "client"].map((r) => (
                  <button
                    key={r}
                    className={`text-xs px-2 py-1 rounded-full border transition ${
                      changeRoleFilter === r
                        ? "bg-slate-700 border-blue-400 text-blue-300"
                        : "bg-slate-900/40 border-slate-700 text-slate-300 hover:border-blue-400 hover:text-blue-300"
                    }`}
                    onClick={() => setChangeRoleFilter(r)}
                  >
                    {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Card:</span>
                  <select
                    value={changeCardFilter}
                    onChange={(e) => setChangeCardFilter(e.target.value)}
                    className="text-xs rounded-lg bg-slate-900/40 border border-slate-700 px-2 py-1 text-slate-200"
                  >
                    <option value="all">All</option>
                    {changeCardOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Time:</span>
                  <select
                    value={changeTimeFilter}
                    onChange={(e) => setChangeTimeFilter(e.target.value)}
                    className="text-xs rounded-lg bg-slate-900/40 border border-slate-700 px-2 py-1 text-slate-200"
                  >
                    <option value="all">All</option>
                    <option value="24h">Last 24 hours</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {filteredChangeLog.map((e) => {
                const isOpen = expandedChange === e.id;
                return (
                  <Card key={e.id} className="bg-slate-800 border border-slate-800 rounded-2xl shadow-md">
                    <CardContent className="p-4">
                      <button
                        className="w-full text-left"
                        onClick={() => setExpandedChange((p) => (p === e.id ? null : e.id))}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-100">
                              {e.cardTitle}
                              <span className="text-slate-400 font-normal"> · {e.sectionHeading}</span>
                              {e.subsectionHeading ? (
                                <span className="text-slate-500 font-normal"> · {e.subsectionHeading}</span>
                              ) : null}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {e.user} ({e.role}) · {new Date(e.at).toLocaleString()} · {e.field}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="text-xs px-2 py-1 rounded border border-slate-700 bg-slate-900/40 text-slate-200 hover:border-blue-400 hover:text-blue-300"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                goToCard(e.cardTitle, null);
                              }}
                              title="Open this card"
                            >
                              Open card
                            </button>
                            <div className="text-xs text-blue-300">{isOpen ? "Hide" : "View"}</div>
                          </div>
                        </div>
                      </button>

                      {isOpen ? (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="rounded-lg bg-slate-900/40 border border-slate-800 p-3">
                            <div className="text-xs text-slate-400 mb-1">Before</div>
                            <div className="text-sm text-slate-200 whitespace-pre-wrap">{e.before}</div>
                          </div>
                          <div className="rounded-lg bg-slate-900/40 border border-slate-800 p-3">
                            <div className="text-xs text-slate-400 mb-1">After</div>
                            <div className="text-sm text-slate-200 whitespace-pre-wrap">{e.after}</div>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}

              {filteredChangeLog.length === 0 ? (
                <div className="text-sm text-slate-500">No changes match that filter.</div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* TOPICS */}
        {activeNav !== "dashboard" && activeNav !== "changes" ? (
          <>
            <div className="flex items-end justify-between gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-blue-300">
                {navItems.find((n) => n.key === activeNav)?.label ?? "Topics"}
              </h2>
              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-500">Showing {filteredCards.length} items</div>
                {canEdit ? (
                  <button
                    className="ml-2 text-xs px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-800 hover:border-blue-400 hover:text-blue-300"
                    onClick={openAddTopic}
                    title="Add a new topic"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus size={16} /> Add Topic
                    </span>
                  </button>
                ) : null}
              </div>
            </div>

            {(() => {
              const renderCard = (c) => {
                const content = contentByTitle[c.title];
                const hasSections = !!content;
                const isExpanded = expandedCard === c.title;
                const isSelected = selectedCard === c.title;
                const showInline = hasSections && isExpanded && isSelected;

                return (
                  <Card
                    key={c.title}
                    id={`card-${slugify(c.title)}`}
                    className={`group transition rounded-2xl shadow-md cursor-pointer border ${
                      isSelected ? "border-slate-700" : "border-transparent"
                    } bg-slate-800 hover:bg-slate-700`}
                    onClick={() => handleCardClick(c.title)}
                  >
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="text-lg font-semibold mb-1 text-slate-100">{c.title}</h3>
                          <p className="text-slate-400 text-sm line-clamp-2">{c.description}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {canEdit && isSelected && isExpanded ? (
                            <button
                              className="rounded-md border border-slate-700 bg-slate-900/40 p-1 hover:border-blue-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditCard(c.title);
                              }}
                              title="Edit topic"
                            >
                              <Pencil size={16} className="text-blue-300" />
                            </button>
                          ) : null}

                          <Star
                            size={18}
                            className={`cursor-pointer transition ${
                              favorites.includes(c.title)
                                ? "text-yellow-400"
                                : "text-slate-500 hover:text-yellow-400"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(c.title);
                            }}
                          />
                        </div>
                      </div>

                      {/* Pills */}
                      {hasSections ? (
                        <div className={`transition-all duration-200 overflow-hidden ${isExpanded ? "max-h-56" : "max-h-0"}`}>
                          <div className="mt-2 flex flex-wrap gap-2 items-center">
                            {content.sections.map((section, idx) => (
                              <button
                                key={idx}
                                className={`text-xs px-2 py-1 rounded-full border border-slate-600 hover:border-blue-400 hover:text-blue-300 truncate max-w-[11rem] ${
                                  isSelected && selectedSectionIndex === idx
                                    ? "bg-slate-700 border-blue-400 text-blue-300"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCard(c.title, idx);
                                }}
                              >
                                {section.heading}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Content */}
                      {showInline ? (
                        <div className="mt-2 pt-3 border-t border-slate-600 group-hover:border-slate-500">
                          <div>
                            <div className="text-sm font-semibold text-blue-300">{content.title}</div>
                            <div className="text-xs text-slate-400 mt-1">{content.intro}</div>
                          </div>

                          <div className="mt-3 space-y-4 text-sm">
                            {selectedSectionIndex === null ? null : (() => {
                              const section = content.sections[selectedSectionIndex];
                              return (
                                <div>
                                  <h4 className="font-semibold text-slate-100 mb-1">{section.heading}</h4>
                                  <p className="text-slate-300 leading-relaxed mb-1">{section.body}</p>

                                  {section.subsections?.length ? (
                                    <div className="mt-2 space-y-2 border-l border-slate-700 pl-3">
                                      {section.subsections.map((sub, sIdx) => (
                                        <div key={sIdx}>
                                          <h5 className="text-slate-200 font-semibold text-xs mb-0.5">{sub.subheading}</h5>
                                          <p className="text-slate-500 text-xs leading-relaxed">{sub.body}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              };

              const left = [];
              const right = [];
              filteredCards.forEach((c, idx) => (idx % 2 === 0 ? left : right).push(c));

              return (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-4">{left.map(renderCard)}</div>
                  <div className="flex-1 flex flex-col gap-4">{right.map(renderCard)}</div>
                </div>
              );
            })()}

            <div className="mt-10 text-xs text-slate-600">Prototype UI (placeholder content).</div>
          </>
        ) : null}
      </main>
    </div>
  );
}
