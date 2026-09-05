const API_URL = "https://api.xoticesports.com";
const SERVER_SLUG = "xotic";

let staffMe = null;
let staffContent = null;

function qs(id) {
    return document.getElementById(id);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatText(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
}

function formatDate(value) {
    return new Date(value).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

async function api(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        credentials: "include",
        ...options,
        headers: {
            ...(options.body instanceof FormData
                ? {}
                : { "Content-Type": "application/json" }),
            ...(options.headers || {})
        }
    });

    let data = {};
    try {
        data = await response.json();
    } catch {}

    if (!response.ok) {
        const error = new Error(data.error || `Request failed (${response.status})`);
        error.status = response.status;
        throw error;
    }

    return data;
}

async function requireStaff() {
    try {
        staffMe = await api("/api/staffhub/me");
        qs("staff-user").innerHTML = `
            <img src="${escapeHtml(staffMe.user.avatar)}" alt="">
            <span>${escapeHtml(staffMe.user.displayName)}</span>
        `;
        qs("staff-server").textContent = staffMe.serverName;
        return true;
    } catch (error) {
        if (error.status === 401) {
            window.location.href =
                `${API_URL}/auth/discord?server=${encodeURIComponent(SERVER_SLUG)}`;
            return false;
        }

        document.body.innerHTML = `
            <main class="access-error">
                <div class="container">
                    <div class="section-label">STAFFHUB ERROR</div>
                    <h1>UNABLE TO VERIFY ACCESS</h1>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            </main>
        `;
        return false;
    }
}

async function loadContent() {
    staffContent = await api("/api/staffhub/content");
    return staffContent;
}

function showEditors() {
    document.querySelectorAll("[data-edit-permission]").forEach(element => {
        const permission = element.dataset.editPermission;
        if (staffMe?.permissions?.[permission]) {
            element.hidden = false;
        }
    });
}

function buildNav() {
    const path = window.location.pathname;
    document.querySelectorAll(".staff-nav a").forEach(link => {
        const target = new URL(link.href).pathname;
        if (target === path) link.classList.add("active");
    });
}

function logout() {
    window.location.href = `${API_URL}/auth/logout`;
}

document.addEventListener("DOMContentLoaded", async () => {
    buildNav();

    const ok = await requireStaff();
    if (!ok) return;

    await loadContent();
    showEditors();

    const page = document.body.dataset.page;

    if (page === "home") renderHome();
    if (page === "commands") renderCommands();
    if (page === "tickets") renderDocumentPage("tickets");
    if (page === "expectations") renderDocumentPage("expectations");
    if (page === "examples") renderDocumentPage("examples");
    if (page === "announcements") renderAnnouncements();
    if (page === "staffupdates") renderStaffUpdates();
    if (page === "admin") renderAdmin();
});

function renderHome() {
    qs("home-welcome").textContent =
        `Welcome, ${staffMe.user.displayName}.`;

    qs("home-role").textContent =
        staffMe.staffRoles.map(role => role.name).join(" • ");

    qs("home-level").textContent =
        staffMe.level >= 0 ? `LEVEL ${staffMe.level}` : "STAFF";

    const cards = [
        ["COMMANDS", "/staffhub/commands", "Commands available to your staff level."],
        ["TICKETS", "/staffhub/tickets", "The official ticket guide."],
        ["EXPECTATIONS", "/staffhub/expectations", "What is expected from Xotic staff."],
        ["EXAMPLES", "/staffhub/examples", "Examples of correct staff behaviour."],
        ["ANNOUNCEMENTS", "/staffhub/announcements", "Latest internal staff announcements."]
    ];

    if (staffContent.canSeeUpdates) {
        cards.push([
            "STAFF UPDATES",
            "/staffhub/staffupdates",
            "High-authority staff changes and history."
        ]);
    }

    qs("home-grid").innerHTML = cards.map(card => `
        <a class="hub-card" href="${card[1]}">
            <div class="hub-card-label">${card[0]}</div>
            <h2>${card[0]}</h2>
            <p>${card[2]}</p>
            <span class="hub-card-arrow">OPEN →</span>
        </a>
    `).join("");

    if (staffMe.founder) {
        qs("founder-admin-card").hidden = false;
    }
}

function renderDocumentPage(page) {
    const data = staffContent.pages[page];
    qs("page-title").textContent = data?.title || page.toUpperCase();
    qs("page-content").innerHTML = data?.content
        ? formatText(data.content)
        : `<div class="empty-state">No content has been added yet.</div>`;

    const canEdit =
        staffMe.permissions[`${page}Edit`] === true;

    if (canEdit) {
        qs("editor").hidden = false;
        qs("editor-title").value = data?.title || "";
        qs("editor-content").value = data?.content || "";
    }
}

async function savePage(page) {
    const button = event.currentTarget;
    button.disabled = true;

    try {
        await api(`/api/staffhub/page/${page}`, {
            method: "PUT",
            body: JSON.stringify({
                title: qs("editor-title").value,
                content: qs("editor-content").value
            })
        });

        await loadContent();
        renderDocumentPage(page);
        alert("Saved.");
    } catch (error) {
        alert(error.message);
    } finally {
        button.disabled = false;
    }
}

function renderCommands() {
    const commands = staffContent.commands || [];

    qs("commands-list").innerHTML = commands.length
        ? commands.map(command => `
            <article class="command-card">
                <div>
                    <span class="command-name">${escapeHtml(command.command)}</span>
                    <p>${formatText(command.use)}</p>
                </div>
                <span class="level-badge">LEVEL ${Number(command.minimumLevel || 0)}+</span>
            </article>
        `).join("")
        : `<div class="empty-state">No commands are currently available to your level.</div>`;

    if (staffMe.permissions.commandsEdit) {
        qs("command-editor").hidden = false;
        renderCommandEditor();
    }
}

function renderCommandEditor() {
    const list = qs("command-editor-list");
    list.innerHTML = (staffContent.commands || []).map(command => `
        <div class="editor-row">
            <input value="${escapeHtml(command.command)}" data-command-id="${command.id}" data-field="command">
            <input value="${escapeHtml(command.use)}" data-command-id="${command.id}" data-field="use">
            <input type="number" min="0" value="${Number(command.minimumLevel || 0)}"
                data-command-id="${command.id}" data-field="minimumLevel">
            <button class="btn btn-primary" onclick="saveCommand('${command.id}')">SAVE</button>
            <button class="btn btn-danger" onclick="deleteCommand('${command.id}')">DELETE</button>
        </div>
    `).join("");
}

function commandValue(id, field) {
    return document.querySelector(
        `[data-command-id="${id}"][data-field="${field}"]`
    )?.value || "";
}

async function saveCommand(id) {
    try {
        await api("/api/staffhub/command", {
            method: "POST",
            body: JSON.stringify({
                id,
                command: commandValue(id, "command"),
                use: commandValue(id, "use"),
                minimumLevel: Number(commandValue(id, "minimumLevel"))
            })
        });

        await loadContent();
        renderCommands();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteCommand(id) {
    if (!confirm("Delete this command?")) return;

    try {
        await api(`/api/staffhub/command/${id}`, { method: "DELETE" });
        await loadContent();
        renderCommands();
    } catch (error) {
        alert(error.message);
    }
}

async function addCommand() {
    try {
        await api("/api/staffhub/command", {
            method: "POST",
            body: JSON.stringify({
                command: qs("new-command").value,
                use: qs("new-use").value,
                minimumLevel: Number(qs("new-level").value || 0)
            })
        });

        qs("new-command").value = "";
        qs("new-use").value = "";
        qs("new-level").value = "0";

        await loadContent();
        renderCommands();
    } catch (error) {
        alert(error.message);
    }
}

function renderAnnouncements() {
    const list = staffContent.announcements || [];

    qs("announcements-list").innerHTML = list.length
        ? list.map(item => `
            <article class="announcement-card">
                <div class="announcement-meta">
                    ${formatDate(item.createdAt)} • ${escapeHtml(item.authorName)}
                </div>
                <h2>${escapeHtml(item.title)}</h2>
                <div class="announcement-body">${formatText(item.content)}</div>
                ${item.images?.length ? `
                    <div class="announcement-images">
                        ${item.images.map(src =>
                            `<img src="${API_URL}${escapeHtml(src)}" alt="">`
                        ).join("")}
                    </div>
                ` : ""}
                ${staffMe.permissions.announcementsPublish ? `
                    <button class="btn btn-danger"
                        onclick="deleteAnnouncement('${item.id}')">DELETE</button>
                ` : ""}
            </article>
        `).join("")
        : `<div class="empty-state">No announcements yet.</div>`;

    if (staffMe.permissions.announcementsPublish) {
        qs("announcement-editor").hidden = false;
    }
}

async function uploadAnnouncementImages() {
    const files = qs("announcement-images").files;
    if (!files.length) return [];

    const form = new FormData();
    for (const file of files) form.append("images", file);

    const data = await api("/api/staffhub/upload", {
        method: "POST",
        body: form
    });

    return data.urls || [];
}

async function publishAnnouncement() {
    const button = event.currentTarget;
    button.disabled = true;

    try {
        const images = await uploadAnnouncementImages();

        await api("/api/staffhub/announcement", {
            method: "POST",
            body: JSON.stringify({
                title: qs("announcement-title").value,
                content: qs("announcement-content").value,
                images
            })
        });

        qs("announcement-title").value = "";
        qs("announcement-content").value = "";
        qs("announcement-images").value = "";

        await loadContent();
        renderAnnouncements();
    } catch (error) {
        alert(error.message);
    } finally {
        button.disabled = false;
    }
}

async function deleteAnnouncement(id) {
    if (!confirm("Delete this announcement?")) return;

    try {
        await api(`/api/staffhub/announcement/${id}`, { method: "DELETE" });
        await loadContent();
        renderAnnouncements();
    } catch (error) {
        alert(error.message);
    }
}

function renderStaffUpdates() {
    if (!staffContent.canSeeUpdates) {
        qs("updates-list").innerHTML =
            `<div class="empty-state">You do not have access to staff updates.</div>`;
        return;
    }

    const updates = staffContent.staffUpdates || [];

    qs("updates-list").innerHTML = updates.length
        ? updates.map(item => `
            <article class="update-card update-${escapeHtml(item.type)}">
                <div class="update-top">
                    <span class="update-type">${escapeHtml(item.type)}</span>
                    <span>${formatDate(item.date)}</span>
                </div>
                <h2>${escapeHtml(item.displayName)}</h2>
                <p>Discord: ${escapeHtml(item.username)}</p>
                <div class="role-change">
                    <div>
                        <strong>Previous</strong>
                        <span>${item.oldRoles?.length
                            ? item.oldRoles.map(r => escapeHtml(r.name)).join(" • ")
                            : "No staff role"}</span>
                    </div>
                    <div>
                        <strong>New</strong>
                        <span>${item.newRoles?.length
                            ? item.newRoles.map(r => escapeHtml(r.name)).join(" • ")
                            : "No staff role"}</span>
                    </div>
                </div>
            </article>
        `).join("")
        : `<div class="empty-state">No staff changes recorded.</div>`;
}

async function renderAdmin() {
    if (!staffMe.founder) {
        qs("admin-content").innerHTML =
            `<div class="empty-state">Founder access required.</div>`;
        return;
    }

    const [permissionsData, rolesData] = await Promise.all([
        api("/api/staffhub/permissions"),
        api("/api/staffhub/roles")
    ]);

    const roles = rolesData.roles.filter(role => !role.managed);
    const permissions = permissionsData.permissions;

    qs("admin-content").innerHTML = `
        <div class="admin-section">
            <div class="section-label">PAGE EDITING</div>
            ${["tickets","expectations","examples","commands"].map(page => {
                const policy = permissions[page] || {};
                return `
                    <div class="permission-card">
                        <h2>${page.toUpperCase()}</h2>
                        <label>Minimum level that can edit</label>
                        <input type="number" min="0"
                            id="min-${page}"
                            value="${Number(policy.minimumLevel ?? 999)}">

                        <label>Additional editor roles</label>
                        <select id="editors-${page}" multiple>
                            ${roles.map(role => `
                                <option value="${role.id}"
                                    ${(policy.editors || []).includes(role.id) ? "selected" : ""}>
                                    ${escapeHtml(role.name)}
                                </option>
                            `).join("")}
                        </select>
                    </div>
                `;
            }).join("")}
        </div>

        <div class="admin-section">
            <div class="section-label">ANNOUNCEMENTS</div>
            <div class="permission-card">
                <h2>WHO CAN PUBLISH</h2>
                <label>Minimum level that can publish</label>
                <input type="number" min="0" id="min-announcements"
                    value="${Number(permissions.announcements?.minimumLevel ?? 999)}">

                <label>Additional publisher roles</label>
                <select id="publishers-announcements" multiple>
                    ${roles.map(role => `
                        <option value="${role.id}"
                            ${(permissions.announcements?.publishers || []).includes(role.id) ? "selected" : ""}>
                            ${escapeHtml(role.name)}
                        </option>
                    `).join("")}
                </select>
            </div>
        </div>

        <button class="btn btn-primary" onclick="savePermissions()">
            SAVE PERMISSIONS
        </button>
    `;
}

function selectedValues(id) {
    return [...document.getElementById(id).selectedOptions].map(x => x.value);
}

async function savePermissions() {
    const permissions = {
        tickets: {
            minimumLevel: Number(qs("min-tickets").value),
            editors: selectedValues("editors-tickets")
        },
        expectations: {
            minimumLevel: Number(qs("min-expectations").value),
            editors: selectedValues("editors-expectations")
        },
        examples: {
            minimumLevel: Number(qs("min-examples").value),
            editors: selectedValues("editors-examples")
        },
        commands: {
            minimumLevel: Number(qs("min-commands").value),
            editors: selectedValues("editors-commands")
        },
        announcements: {
            minimumLevel: Number(qs("min-announcements").value),
            publishers: selectedValues("publishers-announcements")
        }
    };

    try {
        await api("/api/staffhub/permissions", {
            method: "PUT",
            body: JSON.stringify({ permissions })
        });

        alert("Permissions saved.");
    } catch (error) {
        alert(error.message);
    }
}
