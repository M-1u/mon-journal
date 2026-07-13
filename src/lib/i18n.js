// Lightweight i18n. Language is stored globally (localStorage) so it applies
// even on the lock screen, before any journal is unlocked. Components call
// t("key", { vars }); App keeps `lang` in state and re-renders the tree on
// change, so every t() call picks up the new language.

const FR = {
  // Generic
  "app.name": "Mon Journal",
  "common.back": "Retour",
  "common.cancel": "Annuler",
  "common.save": "Enregistrer",
  "common.delete": "Supprimer",
  "common.add": "Ajouter",
  "common.remove": "Retirer",
  "common.open": "Ouvrir",
  "common.change": "Changer…",
  "common.today": "Aujourd'hui",
  "sidebar.footer": "Local · privé · hors-ligne",

  // Nav
  "nav.today": "Aujourd'hui",
  "nav.calendar": "Calendrier",
  "nav.timeline": "Journal",
  "nav.goals": "Objectifs",
  "nav.stats": "Statistiques",
  "nav.gallery": "Galerie",
  "nav.settings": "Réglages",

  // Lock screen
  "lock.chooseJournal": "Choisis ton journal",
  "lock.chooseJournalSub": "Sélectionne un journal pour l'ouvrir.",
  "lock.newJournal": "Nouveau journal",
  "lock.createFirst": "Crée ton journal",
  "lock.createSub": "Choisis un nom et un mot de passe. Le mot de passe sera demandé à chaque ouverture.",
  "lock.name": "Nom du journal (ex. Personnel)",
  "lock.password": "Mot de passe",
  "lock.confirm": "Confirme le mot de passe",
  "lock.create": "Créer le journal",
  "lock.open": "Ouvrir",
  "lock.enterPassword": "Entre le mot de passe pour ouvrir ce journal.",
  "lock.wrongPassword": "Mot de passe incorrect.",
  "lock.errName": "Donne un nom à ton journal.",
  "lock.errShort": "Le mot de passe doit faire au moins 4 caractères.",
  "lock.errMatch": "Les deux mots de passe ne correspondent pas.",
  "lock.warn": "⚠️ Garde ton mot de passe : il protège l'accès et chiffre tes données ; il ne peut pas être récupéré s'il est oublié.",

  // Day view
  "day.newEntry": "Nouvelle entrée",
  "day.prevDay": "Jour précédent",
  "day.nextDay": "Jour suivant",
  "day.future": "Ce jour n'est pas encore arrivé.",
  "day.backToday": "Revenir à aujourd'hui",
  "day.empty": "Aucune entrée pour ce jour.",
  "day.emptyHint": "Ajoute ta première entrée du jour ci-dessus.",
  "day.goalsReached": "{n} objectif atteint",
  "day.goalsReached_plural": "{n} objectifs atteints",

  // Entry editor
  "editor.new": "Nouvelle entrée",
  "editor.edit": "Modifier l'entrée",
  "editor.time": "Heure de l'entrée",
  "editor.mood": "Comment tu te sens ?",
  "editor.activities": "Activités",
  "editor.goals": "Objectifs atteints",
  "editor.note": "Note",
  "editor.photos": "Photos",
  "editor.pickGoal": "＋ Valider un objectif…",
  "editor.allGoals": "Tous tes objectifs sont sélectionnés pour cette entrée.",
  "editor.noGoals": "Aucun objectif défini. Ajoute-en dans l'onglet « Objectifs ».",

  // Activity picker
  "act.none": "Aucune activité. Ajoute-en dans les Réglages.",

  // Markdown editor
  "md.bold": "Gras (Ctrl+B)",
  "md.italic": "Italique (Ctrl+I)",
  "md.heading": "Titre",
  "md.bullet": "Liste à puces",
  "md.ordered": "Liste numérotée",
  "md.quote": "Citation",
  "md.link": "Lien (Ctrl+K)",
  "md.code": "Code",
  "md.preview": "Aperçu",
  "md.edit": "Modifier",
  "md.placeholder": "Écris ce qui te passe par la tête…",
  "md.linkPlaceholder": "https://exemple.com",
  "md.apply": "Appliquer",

  // Photos
  "photo.caption": "Ajouter une description…",

  // Calendar
  "cal.title": "Calendrier",
  "cal.sub": "Un coup d'œil sur tes humeurs, mois par mois.",

  // Timeline
  "tl.title": "Journal",
  "tl.empty": "Aucune entrée pour l'instant.",
  "tl.emptyHint": "Commence par ajouter une entrée dans « Aujourd'hui ».",
  "tl.count": "{n} entrée · de la plus récente à la plus ancienne",
  "tl.count_plural": "{n} entrées · de la plus récente à la plus ancienne",
  "tl.noMood": "Sans humeur",

  // Stats
  "stats.title": "Statistiques",
  "stats.sub": "Tes tendances d'humeur, d'activités et d'écriture.",
  "stats.empty": "Pas encore de données à analyser.",
  "stats.emptyHint": "Ajoute quelques entrées pour voir tes tendances.",
  "stats.streak": "Série en cours",
  "stats.days": "jour",
  "stats.days_plural": "jours",
  "stats.entries": "Entrées",
  "stats.avgMood": "Humeur moyenne",
  "stats.daysLogged": "Jours journalisés",
  "stats.moodDist": "Répartition des humeurs",
  "stats.topActs": "Activités les plus fréquentes",
  "stats.trend": "Tendance · 30 derniers jours",
  "stats.trendStart": "il y a 30 j",
  "stats.trendEnd": "aujourd'hui",

  // Gallery
  "gallery.title": "Galerie",
  "gallery.sub": "{n} photo · toutes tes journées en images",
  "gallery.sub_plural": "{n} photos · toutes tes journées en images",
  "gallery.empty": "Aucune photo pour l'instant.",
  "gallery.emptyHint": "Ajoute des photos à tes journées pour les retrouver ici.",
  "gallery.openDay": "Ouvrir cette journée",

  // Goals
  "goals.title": "Objectifs",
  "goals.sub": "Définis tes objectifs par échéance. Valide-les depuis une entrée du journal.",
  "goals.progress": "{done}/{total} atteint",
  "goals.progress_plural": "{done}/{total} atteints",
  "goals.placeholder": "Nouvel objectif (ex. Courir 10 km)",
  "goals.emptyTerm": "Aucun objectif à {term}.",
  "goals.reachedOn": "Atteint le {date}",
  "term.short": "Court terme",
  "term.medium": "Moyen terme",
  "term.long": "Long terme",

  // Settings
  "set.title": "Réglages",
  "set.sub": "Personnalise l'apparence et le comportement de ton journal.",
  "set.language": "Langue",
  "set.languageSub": "La langue de l'interface.",
  "set.theme": "Thème",
  "set.themeSub": "Clair, sombre, ou selon ton système.",
  "set.light": "Clair",
  "set.dark": "Sombre",
  "set.system": "Système",
  "set.accent": "Couleur d'accent",
  "set.accentSub": "La teinte principale de l'interface.",
  "set.reminder": "Rappel quotidien",
  "set.reminderSub": "Une notification pour penser à écrire.",
  "set.reminderTime": "Heure du rappel",
  "set.reminderTimeSub": "Chaque jour à cette heure.",
  "set.currentJournal": "Journal actuel · {name}",
  "set.previewStore": "Stockage du navigateur (aperçu)",
  "set.lockSwitch": "🔒 Verrouiller / changer",
  "set.footer": "Mon Journal · tes données restent chez toi, hors-ligne. Inspiré de Daily You.",

  // Change password
  "pw.title": "Mot de passe",
  "pw.sub": "Change le mot de passe de ce journal.",
  "pw.updated": "✓ Mot de passe mis à jour",
  "pw.current": "Mot de passe actuel",
  "pw.new": "Nouveau mot de passe",
  "pw.confirm": "Confirme le nouveau mot de passe",
  "pw.errShort": "Le nouveau mot de passe doit faire au moins 4 caractères.",
  "pw.errMatch": "Les deux nouveaux mots de passe ne correspondent pas.",
  "pw.errBad": "Mot de passe actuel incorrect.",
  "pw.errGeneric": "Impossible de changer le mot de passe.",

  // Activities manager
  "actm.title": "Activités",
  "actm.sub": "Les tags que tu peux associer à chaque entrée.",
  "actm.placeholder": "Nouvelle activité (ex. Yoga)",

  // Backup / export
  "backup.title": "Sauvegarde",
  "backup.sub": "Exporte une copie lisible de ton journal, ou restaure-la.",
  "backup.export": "Exporter",
  "backup.import": "Importer",
  "backup.exported": "✓ Journal exporté",
  "backup.imported": "✓ {n} entrée(s) importée(s)",
  "backup.error": "Une erreur est survenue.",

  // Moods
  "mood.5": "Génial",
  "mood.4": "Bien",
  "mood.3": "Neutre",
  "mood.2": "Bof",
  "mood.1": "Horrible",

  // Default activities
  "activity.sport": "Sport",
  "activity.marche": "Marche",
  "activity.sommeil": "Sommeil",
  "activity.sante": "Santé",
  "activity.amis": "Amis",
  "activity.famille": "Famille",
  "activity.couple": "Couple",
  "activity.lecture": "Lecture",
  "activity.film": "Film / Série",
  "activity.jeux": "Jeux",
  "activity.musique": "Musique",
  "activity.travail": "Travail",
  "activity.etudes": "Études",
  "activity.cuisine": "Cuisine",
  "activity.courses": "Courses",
  "activity.menage": "Ménage",
  "activity.voyage": "Voyage",
  "activity.nature": "Nature",
  "activity.repos": "Repos",
};

const EN = {
  "app.name": "My Journal",
  "common.back": "Back",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.add": "Add",
  "common.remove": "Remove",
  "common.open": "Open",
  "common.change": "Change…",
  "common.today": "Today",
  "sidebar.footer": "Local · private · offline",

  "nav.today": "Today",
  "nav.calendar": "Calendar",
  "nav.timeline": "Journal",
  "nav.goals": "Goals",
  "nav.stats": "Statistics",
  "nav.gallery": "Gallery",
  "nav.settings": "Settings",

  "lock.chooseJournal": "Choose your journal",
  "lock.chooseJournalSub": "Select a journal to open it.",
  "lock.newJournal": "New journal",
  "lock.createFirst": "Create your journal",
  "lock.createSub": "Pick a name and a password. The password will be asked every time you open it.",
  "lock.name": "Journal name (e.g. Personal)",
  "lock.password": "Password",
  "lock.confirm": "Confirm password",
  "lock.create": "Create journal",
  "lock.open": "Open",
  "lock.enterPassword": "Enter the password to open this journal.",
  "lock.wrongPassword": "Incorrect password.",
  "lock.errName": "Give your journal a name.",
  "lock.errShort": "The password must be at least 4 characters.",
  "lock.errMatch": "The two passwords don't match.",
  "lock.warn": "⚠️ Keep your password safe: it guards access and encrypts your data; it cannot be recovered if forgotten.",

  "day.newEntry": "New entry",
  "day.prevDay": "Previous day",
  "day.nextDay": "Next day",
  "day.future": "This day hasn't arrived yet.",
  "day.backToday": "Back to today",
  "day.empty": "No entry for this day.",
  "day.emptyHint": "Add your first entry of the day above.",
  "day.goalsReached": "{n} goal reached",
  "day.goalsReached_plural": "{n} goals reached",

  "editor.new": "New entry",
  "editor.edit": "Edit entry",
  "editor.time": "Entry time",
  "editor.mood": "How are you feeling?",
  "editor.activities": "Activities",
  "editor.goals": "Goals reached",
  "editor.note": "Note",
  "editor.photos": "Photos",
  "editor.pickGoal": "＋ Mark a goal as reached…",
  "editor.allGoals": "All your goals are selected for this entry.",
  "editor.noGoals": "No goals defined yet. Add some in the “Goals” tab.",

  "act.none": "No activities. Add some in Settings.",

  "md.bold": "Bold (Ctrl+B)",
  "md.italic": "Italic (Ctrl+I)",
  "md.heading": "Heading",
  "md.bullet": "Bullet list",
  "md.ordered": "Numbered list",
  "md.quote": "Quote",
  "md.link": "Link (Ctrl+K)",
  "md.code": "Code",
  "md.preview": "Preview",
  "md.edit": "Edit",
  "md.placeholder": "Write whatever comes to mind…",
  "md.linkPlaceholder": "https://example.com",
  "md.apply": "Apply",

  "photo.caption": "Add a caption…",

  "cal.title": "Calendar",
  "cal.sub": "A glance at your moods, month by month.",

  "tl.title": "Journal",
  "tl.empty": "No entries yet.",
  "tl.emptyHint": "Start by adding an entry in “Today”.",
  "tl.count": "{n} entry · newest first",
  "tl.count_plural": "{n} entries · newest first",
  "tl.noMood": "No mood",

  "stats.title": "Statistics",
  "stats.sub": "Your mood, activity and writing trends.",
  "stats.empty": "No data to analyze yet.",
  "stats.emptyHint": "Add a few entries to see your trends.",
  "stats.streak": "Current streak",
  "stats.days": "day",
  "stats.days_plural": "days",
  "stats.entries": "Entries",
  "stats.avgMood": "Average mood",
  "stats.daysLogged": "Days journaled",
  "stats.moodDist": "Mood distribution",
  "stats.topActs": "Most frequent activities",
  "stats.trend": "Trend · last 30 days",
  "stats.trendStart": "30 days ago",
  "stats.trendEnd": "today",

  "gallery.title": "Gallery",
  "gallery.sub": "{n} photo · all your days in pictures",
  "gallery.sub_plural": "{n} photos · all your days in pictures",
  "gallery.empty": "No photos yet.",
  "gallery.emptyHint": "Add photos to your days to find them here.",
  "gallery.openDay": "Open this day",

  "goals.title": "Goals",
  "goals.sub": "Set goals by term. Mark them as reached from a journal entry.",
  "goals.progress": "{done}/{total} reached",
  "goals.progress_plural": "{done}/{total} reached",
  "goals.placeholder": "New goal (e.g. Run 10 km)",
  "goals.emptyTerm": "No {term} goals.",
  "goals.reachedOn": "Reached on {date}",
  "term.short": "Short term",
  "term.medium": "Medium term",
  "term.long": "Long term",

  "set.title": "Settings",
  "set.sub": "Customize the look and behavior of your journal.",
  "set.language": "Language",
  "set.languageSub": "The interface language.",
  "set.theme": "Theme",
  "set.themeSub": "Light, dark, or match your system.",
  "set.light": "Light",
  "set.dark": "Dark",
  "set.system": "System",
  "set.accent": "Accent color",
  "set.accentSub": "The main tint of the interface.",
  "set.reminder": "Daily reminder",
  "set.reminderSub": "A notification to remember to write.",
  "set.reminderTime": "Reminder time",
  "set.reminderTimeSub": "Every day at this time.",
  "set.currentJournal": "Current journal · {name}",
  "set.previewStore": "Browser storage (preview)",
  "set.lockSwitch": "🔒 Lock / switch",
  "set.footer": "My Journal · your data stays with you, offline. Inspired by Daily You.",

  "pw.title": "Password",
  "pw.sub": "Change this journal's password.",
  "pw.updated": "✓ Password updated",
  "pw.current": "Current password",
  "pw.new": "New password",
  "pw.confirm": "Confirm new password",
  "pw.errShort": "The new password must be at least 4 characters.",
  "pw.errMatch": "The two new passwords don't match.",
  "pw.errBad": "Current password is incorrect.",
  "pw.errGeneric": "Couldn't change the password.",

  "actm.title": "Activities",
  "actm.sub": "The tags you can attach to each entry.",
  "actm.placeholder": "New activity (e.g. Yoga)",

  "backup.title": "Backup",
  "backup.sub": "Export a readable copy of your journal, or restore one.",
  "backup.export": "Export",
  "backup.import": "Import",
  "backup.exported": "✓ Journal exported",
  "backup.imported": "✓ {n} entr(ies) imported",
  "backup.error": "Something went wrong.",

  "mood.5": "Great",
  "mood.4": "Good",
  "mood.3": "Neutral",
  "mood.2": "Meh",
  "mood.1": "Awful",

  "activity.sport": "Sport",
  "activity.marche": "Walk",
  "activity.sommeil": "Sleep",
  "activity.sante": "Health",
  "activity.amis": "Friends",
  "activity.famille": "Family",
  "activity.couple": "Partner",
  "activity.lecture": "Reading",
  "activity.film": "Film / Series",
  "activity.jeux": "Games",
  "activity.musique": "Music",
  "activity.travail": "Work",
  "activity.etudes": "Studies",
  "activity.cuisine": "Cooking",
  "activity.courses": "Groceries",
  "activity.menage": "Chores",
  "activity.voyage": "Travel",
  "activity.nature": "Nature",
  "activity.repos": "Rest",
};

const DICTS = { fr: FR, en: EN };
export const LANGS = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
];

let lang = "fr";
try {
  const saved = localStorage.getItem("monjournal.lang");
  if (saved && DICTS[saved]) lang = saved;
} catch {
  /* no localStorage */
}

export function getLang() {
  return lang;
}
export function setLang(l) {
  if (!DICTS[l]) return;
  lang = l;
  try {
    localStorage.setItem("monjournal.lang", l);
  } catch {
    /* ignore */
  }
}
export function localeTag() {
  return lang === "en" ? "en-US" : "fr-FR";
}

// t("key", { vars, n }) — supports {var} interpolation and a "_plural" variant
// selected when n != 1.
export function t(key, vars) {
  let k = key;
  if (vars && typeof vars.n === "number" && vars.n !== 1 && (DICTS[lang][key + "_plural"] || FR[key + "_plural"])) {
    k = key + "_plural";
  }
  let s = DICTS[lang][k] ?? FR[k] ?? DICTS[lang][key] ?? FR[key] ?? key;
  if (vars) {
    for (const name in vars) s = s.replace(new RegExp("\\{" + name + "\\}", "g"), vars[name]);
  }
  return s;
}
