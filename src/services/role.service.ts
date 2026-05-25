import { Role } from "../models/Role.js";

export const DEFAULT_ROLE_OPTIONS = [
  { key: "product_manager", label: "Product Manager", description: "Defines product direction and priorities." },
  { key: "frontend_engineer", label: "Frontend Engineer", description: "Builds user-facing interfaces." },
  { key: "backend_engineer", label: "Backend Engineer", description: "Builds and scales backend services." },
  { key: "ux_designer", label: "UX Designer", description: "Designs product experience and usability." },
  { key: "data_analyst", label: "Data Analyst", description: "Turns data into actionable insights." },
  { key: "devops_engineer", label: "DevOps Engineer", description: "Improves reliability and deployment systems." },
  { key: "growth_lead", label: "Growth Lead", description: "Owns acquisition and activation experiments." },
  { key: "sales", label: "Sales", description: "Owns customer relationships and pipeline." },
  { key: "operations", label: "Operations", description: "Keeps delivery smooth across teams." },
  { key: "student", label: "Student", description: "Learner or early career professional." },
];

export const ensureRolesSeeded = async () => {
  await Promise.all(
    DEFAULT_ROLE_OPTIONS.map((role) =>
      Role.updateOne(
        { key: role.key },
        {
          $set: {
            label: role.label,
            description: role.description,
          },
          $setOnInsert: {
            key: role.key,
          },
        },
        { upsert: true },
      ),
    ),
  );
};

export const listRoles = async () => {
  return Role.find({}).sort({ label: 1 }).lean();
};

export const roleExists = async (roleKey: string) => {
  if (!roleKey) {
    return true;
  }

  const exists = await Role.exists({ key: roleKey });
  return Boolean(exists);
};
