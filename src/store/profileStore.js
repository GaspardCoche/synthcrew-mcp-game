import { create } from "zustand";
import { persist } from "zustand/middleware";

const PROJECT_TYPES = {
  saas: "SaaS / Produit web",
  ecommerce: "E-commerce",
  content: "Contenu / Média",
  data: "Data / Analytics",
  opensource: "Open-source",
  agency: "Agence / Freelance",
  other: "Autre",
};

const EXPERIENCE_LEVELS = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
};

const GOALS = {
  automate: "Automatiser des tâches",
  analyze: "Analyser des données",
  content: "Produire du contenu",
  dev: "Développer / Coder",
  communicate: "Communiquer / Collaborer",
  monitor: "Surveiller / Veille",
};

export { PROJECT_TYPES, EXPERIENCE_LEVELS, GOALS };

export const useProfileStore = create(
  persist(
    (set, get) => ({
      username: "",
      projectType: "",
      experienceLevel: "",
      goals: [],
      projectName: "",
      isComplete: false,

      setProfile: (data) =>
        set({
          ...data,
          isComplete: !!(data.username && data.projectType && data.experienceLevel),
        }),

      getProfile: () => {
        const { username, projectType, experienceLevel, goals, projectName, isComplete } = get();
        return { username, projectType, experienceLevel, goals, projectName, isComplete };
      },

      getContextString: () => {
        const { username, projectType, experienceLevel, goals, projectName } = get();
        const parts = [];
        if (username) parts.push(`L'utilisateur s'appelle ${username}.`);
        if (projectName) parts.push(`Son projet s'appelle "${projectName}".`);
        if (projectType) parts.push(`Type de projet : ${PROJECT_TYPES[projectType] || projectType}.`);
        if (experienceLevel) parts.push(`Niveau : ${EXPERIENCE_LEVELS[experienceLevel] || experienceLevel}.`);
        if (goals.length > 0) {
          const goalLabels = goals.map((g) => GOALS[g] || g).join(", ");
          parts.push(`Objectifs : ${goalLabels}.`);
        }
        return parts.join(" ");
      },

      reset: () =>
        set({
          username: "",
          projectType: "",
          experienceLevel: "",
          goals: [],
          projectName: "",
          isComplete: false,
        }),
    }),
    {
      name: "synthcrew-profile-v1",
    }
  )
);
