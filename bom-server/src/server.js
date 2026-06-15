import http from "node:http";
import {
  clearSession,
  createSession,
  getActorFromRequest,
  getTokenFromRequest,
  sanitizeUser
} from "./auth.js";
import { getActorName, hasPermission } from "./permissions.js";
import { readStore, updateStore } from "./store.js";

const PORT = Number(process.env.PORT || 3001);
const ORIGIN = process.env.CORS_ORIGIN || "*";

function createId(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function createProjectId() {
  return `PRJ-${Math.floor(Math.random() * 9000) + 1000}`;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-BOM-User-Id"
  });
  res.end(JSON.stringify(payload));
}

function sendNoContent(res) {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-BOM-User-Id"
  });
  res.end();
}

function notFound(res, message = "Resource not found") {
  sendJson(res, 404, { error: message });
}

function badRequest(res, message) {
  sendJson(res, 400, { error: message });
}

function methodNotAllowed(res) {
  sendJson(res, 405, { error: "Method not allowed" });
}

function unauthorized(res, message = "Authentication required") {
  sendJson(res, 401, { error: message });
}

function forbidden(res, message = "Forbidden") {
  sendJson(res, 403, { error: message });
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}

function appendActivity(store, activity) {
  store.activities.unshift({
    id: createId("act"),
    timestamp: new Date().toISOString(),
    type: "system",
    ...activity
  });

  store.activities = store.activities.slice(0, 50);
}

function getDashboardStats(store) {
  return {
    totalProjects: store.projects.length,
    activeVersions: store.projects.reduce((sum, project) => sum + project.versions.length, 0),
    pendingReviews: store.projects.filter((project) => project.status === "pending").length,
    materialsCount: store.materials.length
  };
}

function validateProject(project) {
  const errors = [];
  const seenPartNumbers = new Set();

  for (const part of project.parts) {
    if (!part.manufacturer || part.manufacturer === "Unknown") {
      errors.push({
        partId: part.id,
        partNumber: part.partNumber,
        type: "missing",
        message: `${part.partNumber} is missing manufacturer information`
      });
    }

    if (part.status === "outdated") {
      errors.push({
        partId: part.id,
        partNumber: part.partNumber,
        type: "outdated",
        message: `${part.partNumber} is marked as outdated`
      });
    }

    if (part.status === "missing") {
      errors.push({
        partId: part.id,
        partNumber: part.partNumber,
        type: "missing",
        message: `${part.partNumber} is missing material information`
      });
    }

    if (seenPartNumbers.has(part.partNumber)) {
      errors.push({
        partId: part.id,
        partNumber: part.partNumber,
        type: "duplicate",
        message: `${part.partNumber} is duplicated in this BOM`
      });
    }

    seenPartNumbers.add(part.partNumber);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function buildUserInitials(displayName) {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || displayName.slice(0, 2).toUpperCase();
}

function findProject(store, projectId) {
  return store.projects.find((project) => project.id === projectId);
}

function findModule(store, moduleId) {
  return store.modules.find((item) => item.id === moduleId);
}

function findSubModule(module, subModuleId) {
  return module.subModules.find((item) => item.id === subModuleId);
}

function requirePermission(req, res, store, permission, message) {
  const actor = getActorFromRequest(req, store);

  if (!actor) {
    unauthorized(res);
    return null;
  }

  if (!hasPermission(actor, permission)) {
    forbidden(res, message);
    return null;
  }

  return actor;
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    return badRequest(res, "Invalid request");
  }

  if (req.method === "OPTIONS") {
    return sendNoContent(res);
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  try {
    if (pathname === "/api/health" && req.method === "GET") {
      return sendJson(res, 200, {
        ok: true,
        service: "bom-server",
        timestamp: new Date().toISOString()
      });
    }

    if (pathname === "/api/stats" && req.method === "GET") {
      return sendJson(res, 200, getDashboardStats(readStore()));
    }

    if (pathname === "/api/auth/login" && req.method === "POST") {
      const body = await readJsonBody(req);
      const { username, password } = body;

      if (!username || !password?.trim()) {
        return badRequest(res, "username and password are required");
      }

      const store = readStore();
      const user = store.users.find((item) => item.username === username);

      if (!user || user.password !== password) {
        return sendJson(res, 401, { error: "Invalid username or password" });
      }

      let session = null;
      updateStore((currentStore) => {
        const currentUser = currentStore.users.find((item) => item.id === user.id);
        if (!currentUser) {
          return currentStore;
        }

        session = createSession(currentStore, currentUser.id);
        return currentStore;
      });

      return sendJson(res, 200, {
        user: sanitizeUser(user),
        token: session?.token
      });
    }

    if (pathname === "/api/auth/me" && req.method === "GET") {
      const store = readStore();
      const actor = getActorFromRequest(req, store);
      if (!actor) {
        return unauthorized(res);
      }

      return sendJson(res, 200, { user: sanitizeUser(actor) });
    }

    if (pathname === "/api/auth/logout" && req.method === "POST") {
      const token = getTokenFromRequest(req);
      if (!token) {
        return sendNoContent(res);
      }

      updateStore((store) => {
        clearSession(store, token);
        return store;
      });

      return sendNoContent(res);
    }

    if (pathname === "/api/users" && req.method === "GET") {
      return sendJson(res, 200, readStore().users.map((user) => sanitizeUser(user)));
    }

    if (pathname === "/api/users" && req.method === "POST") {
      const store = readStore();
      const actor = requirePermission(req, res, store, "canManageUsers", "Only admins can manage users");
      if (!actor) {
        return;
      }

      const body = await readJsonBody(req);

      if (!body.username || !body.displayName || !body.email || !body.role) {
        return badRequest(res, "username, displayName, email and role are required");
      }

      if (store.users.some((item) => item.username === body.username)) {
        return badRequest(res, "Username already exists");
      }

      if (store.users.some((item) => item.email === body.email)) {
        return badRequest(res, "Email already exists");
      }

      const now = new Date().toISOString();
      const nextUser = {
        id: createId("user"),
        username: body.username,
        displayName: body.displayName,
        email: body.email,
        password: body.password || "demo",
        role: body.role,
        initials: buildUserInitials(body.displayName),
        createdAt: now
      };

      updateStore((currentStore) => {
        currentStore.users.push(nextUser);
        appendActivity(currentStore, {
          user: getActorName(actor),
          action: "created",
          target: nextUser.displayName,
          detail: "New user added",
          type: "system"
        });
        return currentStore;
      });

      return sendJson(res, 201, sanitizeUser(nextUser));
    }

    const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
    if (userMatch) {
      const userId = userMatch[1];

      if (req.method === "PATCH") {
        const store = readStore();
        const actor = requirePermission(req, res, store, "canManageUsers", "Only admins can manage users");
        if (!actor) {
          return;
        }

        const body = await readJsonBody(req);
        const existingUser = store.users.find((item) => item.id === userId);
        if (!existingUser) {
          return notFound(res, "User not found");
        }

        if (body.username && store.users.some((item) => item.username === body.username && item.id !== userId)) {
          return badRequest(res, "Username already exists");
        }

        if (body.email && store.users.some((item) => item.email === body.email && item.id !== userId)) {
          return badRequest(res, "Email already exists");
        }

        const updatedStore = updateStore((currentStore) => {
          const user = currentStore.users.find((item) => item.id === userId);
          if (!user) {
            return currentStore;
          }

          Object.assign(user, body);
          if (body.displayName) {
            user.initials = buildUserInitials(body.displayName);
          }
          return currentStore;
        });

        const updatedUser = updatedStore.users.find((item) => item.id === userId);
        if (!updatedUser) {
          return notFound(res, "User not found");
        }

        return sendJson(res, 200, sanitizeUser(updatedUser));
      }

      if (req.method === "DELETE") {
        const store = readStore();
        const actor = requirePermission(req, res, store, "canManageUsers", "Only admins can manage users");
        if (!actor) {
          return;
        }

        const existed = store.users.some((item) => item.id === userId);
        if (!existed) {
          return notFound(res, "User not found");
        }

        updateStore((currentStore) => {
          currentStore.users = currentStore.users.filter((item) => item.id !== userId);
          appendActivity(currentStore, {
            user: getActorName(actor),
            action: "deleted",
            target: userId,
            detail: "User removed",
            type: "system"
          });
          return currentStore;
        });

        return sendNoContent(res);
      }

      return methodNotAllowed(res);
    }

    if (pathname === "/api/projects" && req.method === "GET") {
      return sendJson(res, 200, readStore().projects);
    }

    if (pathname === "/api/projects" && req.method === "POST") {
      const store = readStore();
      const actor = requirePermission(req, res, store, "canCreate", "You do not have permission to create projects");
      if (!actor) {
        return;
      }

      const body = await readJsonBody(req);
      if (!body.name || !body.category || !body.author) {
        return badRequest(res, "name, category and author are required");
      }

      if (body.projectId && store.projects.some((project) => project.projectId === body.projectId)) {
        return badRequest(res, "Project ID already exists");
      }

      const now = new Date().toISOString();
      const nextProject = {
        id: createId("proj"),
        projectId: body.projectId || createProjectId(),
        name: body.name,
        category: body.category,
        subAssembly: body.subAssembly || "",
        currentVersion: body.currentVersion || "v1.0.0",
        author: body.author,
        authorInitials: body.authorInitials || buildUserInitials(body.author),
        status: body.status || "draft",
        lastModified: now,
        parts: Array.isArray(body.parts) ? body.parts : [],
        versions: Array.isArray(body.versions) && body.versions.length > 0
          ? body.versions
          : [
              {
                id: createId("ver"),
                version: body.currentVersion || "v1.0.0",
                description: body.versionDescription || "Initial version",
                author: body.author,
                createdAt: now,
                isActive: true
              }
            ],
        createdAt: now,
        updatedAt: now
      };

      updateStore((store) => {
        store.projects.push(nextProject);
        appendActivity(store, {
          user: getActorName(actor),
          action: "created",
          target: nextProject.name,
          detail: `Created ${nextProject.projectId}`,
          type: "edit"
        });
        return store;
      });

      return sendJson(res, 201, nextProject);
    }

    const projectValidationMatch = pathname.match(/^\/api\/projects\/([^/]+)\/validation$/);
    if (projectValidationMatch && req.method === "GET") {
      const project = findProject(readStore(), projectValidationMatch[1]);
      if (!project) {
        return notFound(res, "Project not found");
      }

      return sendJson(res, 200, validateProject(project));
    }

    const projectVersionMatch = pathname.match(/^\/api\/projects\/([^/]+)\/versions$/);
    if (projectVersionMatch && req.method === "POST") {
      const store = readStore();
      const actor = requirePermission(req, res, store, "canEdit", "You do not have permission to create versions");
      if (!actor) {
        return;
      }

      const body = await readJsonBody(req);
      if (!body.version || !body.author) {
        return badRequest(res, "version and author are required");
      }

      const existingProject = findProject(store, projectVersionMatch[1]);
      if (!existingProject) {
        return notFound(res, "Project not found");
      }

      if (existingProject.versions.some((item) => item.version === body.version)) {
        return badRequest(res, "Version already exists");
      }

      let createdVersion = null;
      const updatedStore = updateStore((currentStore) => {
        const project = findProject(currentStore, projectVersionMatch[1]);
        if (!project) {
          return currentStore;
        }

        project.versions = project.versions.map((item) => ({ ...item, isActive: false }));
        createdVersion = {
          id: createId("ver"),
          version: body.version,
          description: body.description || "Version update",
          author: body.author,
          createdAt: new Date().toISOString(),
          isActive: true
        };
        project.versions.unshift(createdVersion);
        project.currentVersion = createdVersion.version;
        project.updatedAt = createdVersion.createdAt;
        project.lastModified = createdVersion.createdAt;
        project.status = body.status || "pending";

        appendActivity(currentStore, {
          user: getActorName(actor),
          action: "versioned",
          target: project.name,
          detail: `Created ${createdVersion.version}`,
          type: "confirm"
        });
        return currentStore;
      });

      const project = findProject(updatedStore, projectVersionMatch[1]);
      if (!project || !createdVersion) {
        return notFound(res, "Project not found");
      }

      return sendJson(res, 201, createdVersion);
    }

    const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (projectMatch) {
      const projectId = projectMatch[1];

      if (req.method === "GET") {
        const project = findProject(readStore(), projectId);
        if (!project) {
          return notFound(res, "Project not found");
        }
        return sendJson(res, 200, project);
      }

      if (req.method === "PATCH") {
        const store = readStore();
        const body = await readJsonBody(req);

        if (body.status === "approved") {
          const actor = requirePermission(req, res, store, "canApprove", "Only approvers can approve versions");
          if (!actor) {
            return;
          }
        } else {
          const actor = requirePermission(req, res, store, "canEdit", "You do not have permission to update projects");
          if (!actor) {
            return;
          }
        }

        const actor = getActorFromRequest(req, store);

        const updatedStore = updateStore((currentStore) => {
          const project = findProject(currentStore, projectId);
          if (!project) {
            return currentStore;
          }

          Object.assign(project, body, {
            updatedAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
          });

          appendActivity(currentStore, {
            user: getActorName(actor),
            action: "updated",
            target: project.name,
            detail: "Project metadata updated",
            type: "edit"
          });
          return currentStore;
        });

        const project = findProject(updatedStore, projectId);
        if (!project) {
          return notFound(res, "Project not found");
        }

        return sendJson(res, 200, project);
      }

      if (req.method === "DELETE") {
        const store = readStore();
        const actor = requirePermission(req, res, store, "canDelete", "You do not have permission to delete projects");
        if (!actor) {
          return;
        }

        const project = findProject(store, projectId);
        if (!project) {
          return notFound(res, "Project not found");
        }

        updateStore((currentStore) => {
          currentStore.projects = currentStore.projects.filter((item) => item.id !== projectId);
          appendActivity(currentStore, {
            user: getActorName(actor),
            action: "deleted",
            target: project.name,
            detail: `Removed ${project.projectId}`,
            type: "system"
          });
          return currentStore;
        });

        return sendNoContent(res);
      }

      return methodNotAllowed(res);
    }

    if (pathname === "/api/materials" && req.method === "GET") {
      return sendJson(res, 200, readStore().materials);
    }

    if (pathname === "/api/materials" && req.method === "POST") {
      const store = readStore();
      const actor = requirePermission(req, res, store, "canCreate", "You do not have permission to create materials");
      if (!actor) {
        return;
      }

      const body = await readJsonBody(req);
      if (!body.partNumber || !body.description || !body.manufacturer) {
        return badRequest(res, "partNumber, description and manufacturer are required");
      }

      if (store.materials.some((item) => item.partNumber === body.partNumber)) {
        return badRequest(res, "Material part number already exists");
      }

      const nextMaterial = {
        id: createId("mat"),
        partNumber: body.partNumber,
        description: body.description,
        manufacturer: body.manufacturer,
        category: body.category || "Other",
        inventory: Number(body.inventory || 0),
        status: body.status || "preferred",
        createdAt: new Date().toISOString()
      };

      updateStore((currentStore) => {
        currentStore.materials.push(nextMaterial);
        appendActivity(currentStore, {
          user: getActorName(actor),
          action: "added",
          target: nextMaterial.partNumber,
          detail: "Material library updated",
          type: "system"
        });
        return currentStore;
      });

      return sendJson(res, 201, nextMaterial);
    }

    const materialMatch = pathname.match(/^\/api\/materials\/([^/]+)$/);
    if (materialMatch) {
      const materialId = materialMatch[1];

      if (req.method === "PATCH") {
        const store = readStore();
        const actor = requirePermission(req, res, store, "canEdit", "You do not have permission to update materials");
        if (!actor) {
          return;
        }

        const body = await readJsonBody(req);
        if (body.partNumber && store.materials.some((item) => item.partNumber === body.partNumber && item.id !== materialId)) {
          return badRequest(res, "Material part number already exists");
        }

        const updatedStore = updateStore((currentStore) => {
          const material = currentStore.materials.find((item) => item.id === materialId);
          if (!material) {
            return currentStore;
          }

          Object.assign(material, body);
          return currentStore;
        });

        const material = updatedStore.materials.find((item) => item.id === materialId);
        if (!material) {
          return notFound(res, "Material not found");
        }

        return sendJson(res, 200, material);
      }

      if (req.method === "DELETE") {
        const store = readStore();
        const actor = requirePermission(req, res, store, "canDelete", "You do not have permission to delete materials");
        if (!actor) {
          return;
        }

        const existed = store.materials.some((item) => item.id === materialId);
        if (!existed) {
          return notFound(res, "Material not found");
        }

        updateStore((currentStore) => {
          currentStore.materials = currentStore.materials.filter((item) => item.id !== materialId);
          appendActivity(currentStore, {
            user: getActorName(actor),
            action: "deleted",
            target: materialId,
            detail: "Material removed",
            type: "system"
          });
          return currentStore;
        });

        return sendNoContent(res);
      }

      return methodNotAllowed(res);
    }

    if (pathname === "/api/activities" && req.method === "GET") {
      return sendJson(res, 200, readStore().activities);
    }

    if (pathname === "/api/activities" && req.method === "POST") {
      const store = readStore();
      const actor = requirePermission(req, res, store, "canEdit", "You do not have permission to add activities");
      if (!actor) {
        return;
      }

      const body = await readJsonBody(req);
      if (!body.user || !body.action) {
        return badRequest(res, "user and action are required");
      }

      const activity = {
        id: createId("act"),
        user: body.user,
        action: body.action,
        target: body.target || "",
        detail: body.detail || "",
        timestamp: new Date().toISOString(),
        type: body.type || "system"
      };

      updateStore((store) => {
        store.activities.unshift(activity);
        store.activities = store.activities.slice(0, 50);
        return store;
      });

      return sendJson(res, 201, activity);
    }

    if (pathname === "/api/modules" && req.method === "GET") {
      return sendJson(res, 200, readStore().modules);
    }

    if (pathname === "/api/modules" && req.method === "POST") {
      const store = readStore();
      const actor = requirePermission(req, res, store, "canManageModules", "You do not have permission to manage modules");
      if (!actor) {
        return;
      }

      const body = await readJsonBody(req);
      if (!body.name) {
        return badRequest(res, "name is required");
      }

      if (store.modules.some((item) => item.name === body.name)) {
        return badRequest(res, "Module name already exists");
      }

      const now = new Date().toISOString();
      const nextModule = {
        id: createId("mod"),
        name: body.name,
        description: body.description || "",
        icon: body.icon || "folder",
        subModules: [],
        createdAt: now,
        updatedAt: now
      };

      updateStore((currentStore) => {
        currentStore.modules.push(nextModule);
        appendActivity(currentStore, {
          user: getActorName(actor),
          action: "created",
          target: nextModule.name,
          detail: "Module added",
          type: "edit"
        });
        return currentStore;
      });

      return sendJson(res, 201, nextModule);
    }

    const moduleSubModulePartMatch = pathname.match(/^\/api\/modules\/([^/]+)\/submodules\/([^/]+)\/parts(?:\/([^/]+))?$/);
    if (moduleSubModulePartMatch) {
      const [, moduleId, subModuleId, partId] = moduleSubModulePartMatch;

      if (req.method === "POST" && !partId) {
        const store = readStore();
        const actor = requirePermission(req, res, store, "canManageModules", "You do not have permission to manage modules");
        if (!actor) {
          return;
        }

        const body = await readJsonBody(req);
        if (!body.partNumber || !body.description || !body.manufacturer) {
          return badRequest(res, "partNumber, description and manufacturer are required");
        }

        let nextPart = null;
        const updatedStore = updateStore((currentStore) => {
          const module = findModule(currentStore, moduleId);
          const subModule = module ? findSubModule(module, subModuleId) : null;
          if (!subModule) {
            return currentStore;
          }

          nextPart = {
            id: createId("mp"),
            partNumber: body.partNumber,
            description: body.description,
            manufacturer: body.manufacturer,
            alternates: Array.isArray(body.alternates) ? body.alternates : [],
            quantity: Number(body.quantity || 1),
            refDes: body.refDes,
            footprint: body.footprint
          };

          subModule.parts.push(nextPart);
          subModule.updatedAt = new Date().toISOString();
          module.updatedAt = subModule.updatedAt;
          return currentStore;
        });

        const module = findModule(updatedStore, moduleId);
        const subModule = module ? findSubModule(module, subModuleId) : null;
        if (!subModule || !nextPart) {
          return notFound(res, "Sub-module not found");
        }

        return sendJson(res, 201, nextPart);
      }

      if (req.method === "PATCH" && partId) {
        const store = readStore();
        const actor = requirePermission(req, res, store, "canManageModules", "You do not have permission to manage modules");
        if (!actor) {
          return;
        }

        const body = await readJsonBody(req);
        const updatedStore = updateStore((currentStore) => {
          const module = findModule(currentStore, moduleId);
          const subModule = module ? findSubModule(module, subModuleId) : null;
          const part = subModule?.parts.find((item) => item.id === partId);
          if (!part) {
            return currentStore;
          }

          Object.assign(part, body);
          subModule.updatedAt = new Date().toISOString();
          module.updatedAt = subModule.updatedAt;
          return currentStore;
        });

        const module = findModule(updatedStore, moduleId);
        const subModule = module ? findSubModule(module, subModuleId) : null;
        const part = subModule?.parts.find((item) => item.id === partId);
        if (!part) {
          return notFound(res, "Part not found");
        }

        return sendJson(res, 200, part);
      }

      if (req.method === "DELETE" && partId) {
        const store = readStore();
        const actor = requirePermission(req, res, store, "canDelete", "You do not have permission to delete module parts");
        if (!actor) {
          return;
        }

        const module = findModule(store, moduleId);
        const subModule = module ? findSubModule(module, subModuleId) : null;
        const part = subModule?.parts.find((item) => item.id === partId);
        if (!part) {
          return notFound(res, "Part not found");
        }

        updateStore((currentStore) => {
          const currentModule = findModule(currentStore, moduleId);
          const currentSubModule = currentModule ? findSubModule(currentModule, subModuleId) : null;
          if (!currentSubModule) {
            return currentStore;
          }

          currentSubModule.parts = currentSubModule.parts.filter((item) => item.id !== partId);
          currentSubModule.updatedAt = new Date().toISOString();
          currentModule.updatedAt = currentSubModule.updatedAt;
          return currentStore;
        });

        return sendNoContent(res);
      }

      return methodNotAllowed(res);
    }

    const moduleSubModuleMatch = pathname.match(/^\/api\/modules\/([^/]+)\/submodules(?:\/([^/]+))?$/);
    if (moduleSubModuleMatch) {
      const [, moduleId, subModuleId] = moduleSubModuleMatch;

      if (req.method === "POST" && !subModuleId) {
        const store = readStore();
        const actor = requirePermission(req, res, store, "canManageModules", "You do not have permission to manage modules");
        if (!actor) {
          return;
        }

        const body = await readJsonBody(req);
        if (!body.name) {
          return badRequest(res, "name is required");
        }

        let nextSubModule = null;
        const updatedStore = updateStore((currentStore) => {
          const module = findModule(currentStore, moduleId);
          if (!module) {
            return currentStore;
          }

          const now = new Date().toISOString();
          nextSubModule = {
            id: createId("sub"),
            name: body.name,
            description: body.description || "",
            parts: [],
            createdAt: now,
            updatedAt: now
          };

          module.subModules.push(nextSubModule);
          module.updatedAt = now;
          return currentStore;
        });

        const module = findModule(updatedStore, moduleId);
        if (!module || !nextSubModule) {
          return notFound(res, "Module not found");
        }

        return sendJson(res, 201, nextSubModule);
      }

      if (req.method === "PATCH" && subModuleId) {
        const store = readStore();
        const actor = requirePermission(req, res, store, "canManageModules", "You do not have permission to manage modules");
        if (!actor) {
          return;
        }

        const body = await readJsonBody(req);
        const updatedStore = updateStore((currentStore) => {
          const module = findModule(currentStore, moduleId);
          const subModule = module ? findSubModule(module, subModuleId) : null;
          if (!subModule) {
            return currentStore;
          }

          Object.assign(subModule, body, { updatedAt: new Date().toISOString() });
          module.updatedAt = subModule.updatedAt;
          return currentStore;
        });

        const module = findModule(store, moduleId);
        const subModule = module ? findSubModule(module, subModuleId) : null;
        if (!subModule) {
          return notFound(res, "Sub-module not found");
        }

        return sendJson(res, 200, subModule);
      }

      if (req.method === "DELETE" && subModuleId) {
        const store = readStore();
        const actor = requirePermission(req, res, store, "canDelete", "You do not have permission to delete sub-modules");
        if (!actor) {
          return;
        }

        const module = findModule(store, moduleId);
        const subModule = module ? findSubModule(module, subModuleId) : null;
        if (!subModule) {
          return notFound(res, "Sub-module not found");
        }

        updateStore((currentStore) => {
          const currentModule = findModule(currentStore, moduleId);
          if (!currentModule) {
            return currentStore;
          }

          currentModule.subModules = currentModule.subModules.filter((item) => item.id !== subModuleId);
          currentModule.updatedAt = new Date().toISOString();
          return currentStore;
        });

        return sendNoContent(res);
      }

      return methodNotAllowed(res);
    }

    const moduleMatch = pathname.match(/^\/api\/modules\/([^/]+)$/);
    if (moduleMatch) {
      const moduleId = moduleMatch[1];

      if (req.method === "GET") {
        const module = findModule(readStore(), moduleId);
        if (!module) {
          return notFound(res, "Module not found");
        }
        return sendJson(res, 200, module);
      }

      if (req.method === "PATCH") {
        const store = readStore();
        const actor = requirePermission(req, res, store, "canManageModules", "You do not have permission to manage modules");
        if (!actor) {
          return;
        }

        const body = await readJsonBody(req);
        const updatedStore = updateStore((currentStore) => {
          const module = findModule(currentStore, moduleId);
          if (!module) {
            return currentStore;
          }

          Object.assign(module, body, { updatedAt: new Date().toISOString() });
          return currentStore;
        });

        const module = findModule(updatedStore, moduleId);
        if (!module) {
          return notFound(res, "Module not found");
        }

        return sendJson(res, 200, module);
      }

      if (req.method === "DELETE") {
        const store = readStore();
        const actor = requirePermission(req, res, store, "canDelete", "You do not have permission to delete modules");
        if (!actor) {
          return;
        }

        const existed = !!findModule(store, moduleId);
        if (!existed) {
          return notFound(res, "Module not found");
        }

        updateStore((currentStore) => {
          currentStore.modules = currentStore.modules.filter((item) => item.id !== moduleId);
          return currentStore;
        });

        return sendNoContent(res);
      }

      return methodNotAllowed(res);
    }

    return notFound(res);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, {
      error: "Internal server error",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(PORT, () => {
  console.log(`BOM server listening on http://localhost:${PORT}`);
});
