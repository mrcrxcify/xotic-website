const API_URL = "https://api.xoticesports.com"
const SERVER_SLUG = "xotic"

let staffMe = null
let staffContent = null
let commandCategories = []
let commandRoles = []

function qs(id) {
    return document.getElementById(id)
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}

function formatText(value) {
    return escapeHtml(value).replace(/\n/g, "<br>")
}

function formatDate(value) {
    return new Date(value).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    })
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
    })

    let data = {}

    try {
        data = await response.json()
    } catch {}

    if (!response.ok) {
        const error = new Error(
            data.error || `Request failed (${response.status})`
        )

        error.status = response.status
        throw error
    }

    return data
}


/* =========================
   AUTHENTICATION
========================= */

async function requireStaff() {
    try {
        staffMe = await api("/api/staffhub/me")

        if (qs("staff-user")) {
            qs("staff-user").innerHTML = `
                <img src="${escapeHtml(staffMe.user.avatar)}" alt="">
                <span>${escapeHtml(staffMe.user.displayName)}</span>
            `
        }

        if (qs("staff-server")) {
            qs("staff-server").textContent = staffMe.serverName
        }

        return true
    } catch (error) {
        if (error.status === 401) {
            window.location.href =
                `${API_URL}/auth/discord?server=${encodeURIComponent(SERVER_SLUG)}`

            return false
        }

        document.body.innerHTML = `
            <main class="access-error">
                <div class="container">
                    <div class="section-label">STAFFHUB ERROR</div>
                    <h1>UNABLE TO VERIFY ACCESS</h1>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            </main>
        `

        return false
    }
}

async function loadContent() {
    staffContent = await api("/api/staffhub/content")
    return staffContent
}


/* =========================
   NAVIGATION
========================= */

function buildNav() {
    const path = window.location.pathname

    document.querySelectorAll(".staff-nav a").forEach(link => {
        const target = new URL(link.href).pathname

        if (
            target === path ||
            (path === "/staffhub" && target === "/staffhub/") ||
            (path === "/staffhub/" && target === "/staffhub/")
        ) {
            link.classList.add("active")
        }
    })
}

function logout() {
    window.location.href = `${API_URL}/auth/logout`
}


/* =========================
   PAGE ACCESS
========================= */

function pagePermission(page, type = "view") {
    return staffMe?.permissions?.[page]?.[type] === true
}

function showEditors() {
    document.querySelectorAll("[data-edit-permission]").forEach(element => {
        const permission = element.dataset.editPermission

        if (staffMe?.permissions?.[permission]) {
            element.hidden = false
        }
    })
}

function redirectIfNoAccess(page) {
    if (pagePermission(page, "view")) {
        return true
    }

    document.body.innerHTML = `
        <main class="access-error">
            <div class="container">
                <div class="section-label">ACCESS DENIED</div>
                <h1>YOU CANNOT ACCESS THIS PAGE</h1>
                <p>You do not currently have permission to view this StaffHub page.</p>
                <a class="btn btn-primary" href="/staffhub/">RETURN TO STAFFHUB</a>
            </div>
        </main>
    `

    return false
}


/* =========================
   STARTUP
========================= */

document.addEventListener("DOMContentLoaded", async () => {
    buildNav()

    const ok = await requireStaff()

    if (!ok) return

    await loadContent()
    showEditors()

    const page = document.body.dataset.page

    if (!page) return

    if (!redirectIfNoAccess(page)) return

    if (page === "home") {
        renderHome()
    }

    if (page === "commands") {
        renderCommands()
    }

    if (page === "tickets") {
        renderDocumentPage("tickets")
    }

    if (page === "etiquette") {
        renderDocumentPage("etiquette")
    }

    if (page === "announcements") {
        renderAnnouncements()
    }

    if (page === "promosDemos") {
        renderDocumentPage("promosDemos")
    }

    if (page === "currentStaff") {
        renderCurrentStaff()
    }
})


/* =========================
   HOME
========================= */

function renderHome() {
    if (qs("home-welcome")) {
        qs("home-welcome").textContent =
            `Welcome, ${staffMe.user.displayName}.`
    }

    if (qs("home-role")) {
        qs("home-role").textContent =
            staffMe.staffRoles.map(role => role.name).join(" • ")
    }

    if (qs("home-level")) {
        qs("home-level").textContent =
            staffMe.level >= 0
                ? `LEVEL ${staffMe.level}`
                : "STAFF"
    }

    const pages = [
        {
            key: "commands",
            title: "COMMANDS",
            description: "Commands available to you based on your staff access.",
            href: "/staffhub/commands"
        },
        {
            key: "tickets",
            title: "TICKETS",
            description: "The official guide for handling staff tickets.",
            href: "/staffhub/tickets"
        },
        {
            key: "etiquette",
            title: "ETIQUETTE",
            description: "Standards and expectations for Xotic staff.",
            href: "/staffhub/etiquette"
        },
        {
            key: "announcements",
            title: "ANNOUNCEMENTS",
            description: "Important internal Xotic staff announcements.",
            href: "/staffhub/announcements"
        },
        {
            key: "promosDemos",
            title: "PROMOS & DEMOS",
            description: "Promotional and demonstration resources.",
            href: "/staffhub/promos-demos"
        },
        {
            key: "currentStaff",
            title: "CURRENT STAFF",
            description: "View the current Xotic Esports staff hierarchy.",
            href: "/staffhub/current-staff"
        }
    ]

    const visiblePages = pages.filter(page =>
        pagePermission(page.key, "view")
    )

    if (qs("home-grid")) {
        qs("home-grid").innerHTML = visiblePages.map(page => `
            <a class="hub-card" href="${page.href}">
                <div class="hub-card-label">${page.title}</div>
                <h2>${page.title}</h2>
                <p>${escapeHtml(page.description)}</p>
                <span class="hub-card-arrow">OPEN →</span>
            </a>
        `).join("")
    }
}


/* =========================
   COMMANDS
========================= */

async function loadCommands() {
    const data = await api("/api/staffhub/commands")

    commandCategories = data.categories || []

    return data
}

function renderCommands() {
    const list = qs("commands-list")

    if (!list) return

    list.innerHTML = `
        <div class="empty-state">Loading commands...</div>
    `

    loadCommands()
        .then(data => {
            commandCategories = data.categories || []

            if (!commandCategories.length) {
                list.innerHTML = `
                    <div class="empty-state">
                        No command categories have been added yet.
                    </div>
                `
            } else {
                list.innerHTML = commandCategories.map(category => `
                    <section class="command-category">
                        <div class="command-category-header">
                            <div>
                                <div class="section-label">
                                    COMMAND CATEGORY
                                </div>

                                <h2>
                                    ${escapeHtml(category.name)}
                                </h2>

                                ${
                                    category.description
                                        ? `<p>${formatText(category.description)}</p>`
                                        : ""
                                }
                            </div>
                        </div>

                        <div class="command-list">
                            ${
                                category.commands?.length
                                    ? category.commands.map(command => `
                                        <article class="command-card">
                                            <div class="command-card-main">
                                                <code>
                                                    ${escapeHtml(command.command)}
                                                </code>

                                                <p>
                                                    ${formatText(command.description)}
                                                </p>
                                            </div>
                                        </article>
                                    `).join("")
                                    : `
                                        <div class="empty-state">
                                            No commands available in this category.
                                        </div>
                                    `
                            }
                        </div>
                    </section>
                `).join("")
            }

            if (staffMe.permissions.commands.edit) {
                if (qs("commands-edit-button")) {
                    qs("commands-edit-button").hidden = false
                }
            }

            if (staffMe.founder) {
                if (qs("commands-permissions-button")) {
                    qs("commands-permissions-button").hidden = false
                }
            }
        })
        .catch(error => {
            list.innerHTML = `
                <div class="empty-state">
                    ${escapeHtml(error.message)}
                </div>
            `
        })
}


/* =========================
   COMMAND EDITOR
========================= */

async function openCommandEditor() {
    if (!staffMe.permissions.commands.edit) {
        alert("You do not have permission to edit commands.")
        return
    }

    const editor = qs("command-editor")

    if (!editor) return

    editor.hidden = false

    await loadCommands()

    renderCommandEditor()
}

function closeCommandEditor() {
    if (qs("command-editor")) {
        qs("command-editor").hidden = true
    }
}

function renderCommandEditor() {
    const container = qs("command-editor-list")

    if (!container) return

    container.innerHTML = `
        <div class="editor-toolbar">
            <button class="btn btn-primary"
                onclick="addCommandCategory()">
                ADD CATEGORY
            </button>
        </div>

        ${
            commandCategories.length
                ? commandCategories.map(category => `
                    <section class="command-editor-category">
                        <div class="editor-category-top">
                            <div>
                                <h2>
                                    ${escapeHtml(category.name)}
                                </h2>

                                ${
                                    category.description
                                        ? `<p>${formatText(category.description)}</p>`
                                        : ""
                                }
                            </div>

                            <div class="editor-actions">
                                <button class="btn"
                                    onclick="editCommandCategory('${category.id}')">
                                    EDIT
                                </button>

                                <button class="btn btn-danger"
                                    onclick="deleteCommandCategory('${category.id}')">
                                    DELETE
                                </button>
                            </div>
                        </div>

                        <div class="editor-command-list">
                            ${
                                category.commands?.length
                                    ? category.commands.map(command => `
                                        <div class="editor-command">
                                            <div>
                                                <code>
                                                    ${escapeHtml(command.command)}
                                                </code>

                                                <p>
                                                    ${formatText(command.description)}
                                                </p>

                                                <small>
                                                    ${formatCommandAudience(command.audience)}
                                                </small>
                                            </div>

                                            <div class="editor-actions">
                                                <button class="btn"
                                                    onclick="editCommand(
                                                        '${category.id}',
                                                        '${command.id}'
                                                    )">
                                                    EDIT
                                                </button>

                                                <button class="btn btn-danger"
                                                    onclick="deleteCommand(
                                                        '${category.id}',
                                                        '${command.id}'
                                                    )">
                                                    DELETE
                                                </button>
                                            </div>
                                        </div>
                                    `).join("")
                                    : `
                                        <div class="empty-state">
                                            No commands in this category.
                                        </div>
                                    `
                            }
                        </div>

                        <button class="btn btn-primary"
                            onclick="addCommand('${category.id}')">
                            ADD COMMAND
                        </button>
                    </section>
                `).join("")
                : `
                    <div class="empty-state">
                        No categories have been created.
                    </div>
                `
        }
    `
}

function formatCommandAudience(audience) {
    if (!audience) return "STAFF ACCESS"

    if (audience.type === "everyone") {
        return "AVAILABLE TO EVERYONE"
    }

    if (audience.type === "staff") {
        return "AVAILABLE TO ALL STAFF"
    }

    if (audience.type === "roles") {
        const roleIds = audience.roles || []

        const names = roleIds.map(id => {
            const role = commandRoles.find(role => role.id === id)

            return role
                ? role.name
                : id
        })

        return `AVAILABLE TO: ${names.map(escapeHtml).join(", ")}`
    }

    return "STAFF ACCESS"
}


/* =========================
   COMMAND CATEGORIES
========================= */

async function addCommandCategory() {
    const name = prompt("Category name:")

    if (!name?.trim()) return

    const description = prompt("Category description:") || ""

    try {
        await api("/api/staffhub/commands/categories", {
            method: "POST",
            body: JSON.stringify({
                name: name.trim(),
                description
            })
        })

        await loadCommands()
        renderCommandEditor()
        renderCommands()
    } catch (error) {
        alert(error.message)
    }
}

async function editCommandCategory(categoryId) {
    const category = commandCategories.find(
        category => category.id === categoryId
    )

    if (!category) return

    const name = prompt(
        "Category name:",
        category.name
    )

    if (!name?.trim()) return

    const description = prompt(
        "Category description:",
        category.description || ""
    ) || ""

    try {
        await api(
            `/api/staffhub/commands/categories/${categoryId}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    name: name.trim(),
                    description
                })
            }
        )

        await loadCommands()
        renderCommandEditor()
        renderCommands()
    } catch (error) {
        alert(error.message)
    }
}

async function deleteCommandCategory(categoryId) {
    const category = commandCategories.find(
        category => category.id === categoryId
    )

    if (!category) return

    if (
        !confirm(
            `Delete "${category.name}" and all commands inside it?`
        )
    ) {
        return
    }

    try {
        await api(
            `/api/staffhub/commands/categories/${categoryId}`,
            {
                method: "DELETE"
            }
        )

        await loadCommands()
        renderCommandEditor()
        renderCommands()
    } catch (error) {
        alert(error.message)
    }
}


/* =========================
   COMMANDS
========================= */

async function addCommand(categoryId) {
    await loadCommandRoles()

    const command = prompt("Command:")

    if (!command?.trim()) return

    const description = prompt("What does this command do?") || ""

    const audience = await promptCommandAudience()

    if (!audience) return

    try {
        await api(
            `/api/staffhub/commands/categories/${categoryId}/commands`,
            {
                method: "POST",
                body: JSON.stringify({
                    command: command.trim(),
                    description,
                    audience
                })
            }
        )

        await loadCommands()
        renderCommandEditor()
        renderCommands()
    } catch (error) {
        alert(error.message)
    }
}

async function editCommand(categoryId, commandId) {
    await loadCommandRoles()

    const category = commandCategories.find(
        category => category.id === categoryId
    )

    if (!category) return

    const commandData = category.commands.find(
        command => command.id === commandId
    )

    if (!commandData) return

    const command = prompt(
        "Command:",
        commandData.command
    )

    if (!command?.trim()) return

    const description = prompt(
        "What does this command do?",
        commandData.description || ""
    ) || ""

    const audience = await promptCommandAudience(
        commandData.audience
    )

    if (!audience) return

    try {
        await api(
            `/api/staffhub/commands/categories/${categoryId}/commands/${commandId}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    command: command.trim(),
                    description,
                    audience
                })
            }
        )

        await loadCommands()
        renderCommandEditor()
        renderCommands()
    } catch (error) {
        alert(error.message)
    }
}

async function deleteCommand(categoryId, commandId) {
    if (!confirm("Delete this command?")) return

    try {
        await api(
            `/api/staffhub/commands/categories/${categoryId}/commands/${commandId}`,
            {
                method: "DELETE"
            }
        )

        await loadCommands()
        renderCommandEditor()
        renderCommands()
    } catch (error) {
        alert(error.message)
    }
}


/* =========================
   COMMAND AUDIENCE
========================= */

async function loadCommandRoles() {
    try {
        const data = await api("/api/staffhub/roles")

        commandRoles = (data.roles || [])
            .filter(role => !role.managed)
            .sort((a, b) => b.position - a.position)

        return commandRoles
    } catch (error) {
        alert(error.message)
        return []
    }
}

async function promptCommandAudience(existing = null) {
    const currentType =
        existing?.type || "staff"

    const type = prompt(
        "Who can use this command?\n\n" +
        "everyone = everyone in the server\n" +
        "staff = all staff\n" +
        "roles = selected Discord roles\n\n" +
        `Current: ${currentType}`,
        currentType
    )

    if (!type) return null

    const normalized = type.trim().toLowerCase()

    if (!["everyone", "staff", "roles"].includes(normalized)) {
        alert("Use everyone, staff, or roles.")
        return null
    }

    if (normalized !== "roles") {
        return {
            type: normalized,
            roles: []
        }
    }

    if (!commandRoles.length) {
        alert("No Discord roles could be loaded.")
        return null
    }

    const roleText = prompt(
        "Enter the Discord role IDs allowed to use this command.\n\n" +
        "Separate multiple IDs with commas.",
        existing?.roles?.join(", ") || ""
    )

    if (!roleText?.trim()) {
        alert("You must provide at least one role ID.")
        return null
    }

    const roles = roleText
        .split(",")
        .map(id => id.trim())
        .filter(Boolean)

    const invalid = roles.filter(
        id => !commandRoles.some(role => role.id === id)
    )

    if (invalid.length) {
        alert(
            `These role IDs were not found:\n${invalid.join("\n")}`
        )

        return null
    }

    return {
        type: "roles",
        roles
    }
}


/* =========================
   COMMAND PAGE PERMISSIONS
========================= */

async function openCommandPermissions() {
    if (!staffMe.founder) {
        alert("Founder access required.")
        return
    }

    const container = qs("command-permissions")

    if (!container) return

    container.hidden = false

    await renderCommandPermissions()
}

function closeCommandPermissions() {
    if (qs("command-permissions")) {
        qs("command-permissions").hidden = true
    }
}

async function renderCommandPermissions() {
    const container = qs("command-permissions-content")

    if (!container) return

    try {
        const [permissionsData, rolesData] = await Promise.all([
            api("/api/staffhub/permissions"),
            api("/api/staffhub/roles")
        ])

        const policy = permissionsData.permissions.commands || {}

        const roles = (rolesData.roles || [])
            .filter(role => !role.managed)
            .sort((a, b) => b.position - a.position)

        commandRoles = roles

        container.innerHTML = `
            <div class="permission-card">

                <h2>COMMANDS VIEW ACCESS</h2>

                <label>
                    Page enabled
                </label>

                <select id="commands-page-enabled">
                    <option value="true"
                        ${policy.enabled !== false ? "selected" : ""}>
                        ENABLED
                    </option>

                    <option value="false"
                        ${policy.enabled === false ? "selected" : ""}>
                        DISABLED
                    </option>
                </select>

                <label>
                    Minimum staff level
                </label>

                <input
                    type="number"
                    id="commands-view-level"
                    value="${Number(
                        policy.view?.minimumLevel ?? 750
                    )}"
                    min="0"
                >

                <label>
                    Additional roles allowed to view
                </label>

                <select id="commands-view-roles" multiple>
                    ${roles.map(role => `
                        <option
                            value="${role.id}"
                            ${
                                (policy.view?.roles || [])
                                    .includes(role.id)
                                    ? "selected"
                                    : ""
                            }
                        >
                            ${escapeHtml(role.name)}
                        </option>
                    `).join("")}
                </select>

            </div>

            <div class="permission-card">

                <h2>COMMANDS EDIT ACCESS</h2>

                <label>
                    Minimum staff level
                </label>

                <input
                    type="number"
                    id="commands-edit-level"
                    value="${Number(
                        policy.edit?.minimumLevel ?? 1000
                    )}"
                    min="0"
                >

                <label>
                    Additional roles allowed to edit
                </label>

                <select id="commands-edit-roles" multiple>
                    ${roles.map(role => `
                        <option
                            value="${role.id}"
                            ${
                                (policy.edit?.roles || [])
                                    .includes(role.id)
                                    ? "selected"
                                    : ""
                            }
                        >
                            ${escapeHtml(role.name)}
                        </option>
                    `).join("")}
                </select>

            </div>

            <button
                class="btn btn-primary"
                onclick="saveCommandPermissions()"
            >
                SAVE COMMAND PERMISSIONS
            </button>
        `
    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                ${escapeHtml(error.message)}
            </div>
        `
    }
}

function selectedValues(id) {
    const element = qs(id)

    if (!element) return []

    return [...element.selectedOptions]
        .map(option => option.value)
}

async function saveCommandPermissions() {
    if (!staffMe.founder) {
        alert("Founder access required.")
        return
    }

    try {
        const existing = await api("/api/staffhub/permissions")

        const permissions = existing.permissions || {}

        permissions.commands = {
            enabled:
                qs("commands-page-enabled").value === "true",

            view: {
                minimumLevel:
                    Number(qs("commands-view-level").value),

                roles:
                    selectedValues("commands-view-roles")
            },

            edit: {
                minimumLevel:
                    Number(qs("commands-edit-level").value),

                roles:
                    selectedValues("commands-edit-roles")
            }
        }

        await api("/api/staffhub/permissions", {
            method: "PUT",
            body: JSON.stringify({
                permissions
            })
        })

        await loadContent()

        alert("Command permissions saved.")

        closeCommandPermissions()
    } catch (error) {
        alert(error.message)
    }
}


/* =========================
   DOCUMENT PAGES
========================= */

function renderDocumentPage(page) {
    const data = staffContent?.pages?.[page]

    const titleElement = qs("page-title")
    const contentElement = qs("page-content")

    if (titleElement) {
        titleElement.textContent =
            data?.title ||
            page
                .replace(/([A-Z])/g, " $1")
                .toUpperCase()
    }

    if (contentElement) {
        if (data?.categories?.length) {
            contentElement.innerHTML =
                data.categories.map(category => `
                    <section class="document-category">

                        <div class="section-label">
                            CATEGORY
                        </div>

                        <h2>
                            ${escapeHtml(category.title || category.name)}
                        </h2>

                        ${
                            category.content
                                ? `<div class="document-text">
                                    ${formatText(category.content)}
                                </div>`
                                : ""
                        }

                        ${
                            category.images?.length
                                ? `
                                    <div class="document-images">
                                        ${category.images.map(src => `
                                            <img
                                                src="${API_URL}${escapeHtml(src)}"
                                                alt=""
                                            >
                                        `).join("")}
                                    </div>
                                `
                                : ""
                        }

                    </section>
                `).join("")
        } else if (data?.content) {
            contentElement.innerHTML =
                formatText(data.content)
        } else {
            contentElement.innerHTML = `
                <div class="empty-state">
                    No content has been added yet.
                </div>
            `
        }
    }

    if (pagePermission(page, "edit") && qs("editor")) {
        qs("editor").hidden = false

        if (qs("editor-title")) {
            qs("editor-title").value =
                data?.title || ""
        }

        if (qs("editor-content")) {
            qs("editor-content").value =
                data?.content || ""
        }
    }
}

async function savePage(page) {
    const button = event.currentTarget

    if (button) {
        button.disabled = true
    }

    try {
        await api(`/api/staffhub/page/${page}`, {
            method: "PUT",
            body: JSON.stringify({
                title: qs("editor-title")?.value || "",
                content: qs("editor-content")?.value || ""
            })
        })

        await loadContent()

        renderDocumentPage(page)

        alert("Saved.")
    } catch (error) {
        alert(error.message)
    } finally {
        if (button) {
            button.disabled = false
        }
    }
}


/* =========================
   ANNOUNCEMENTS
========================= */

function renderAnnouncements() {
    const list = qs("announcements-list")

    if (!list) return

    const announcements =
        staffContent?.pages?.announcements?.announcements || []

    if (!announcements.length) {
        list.innerHTML = `
            <div class="empty-state">
                No announcements yet.
            </div>
        `
    } else {
        list.innerHTML = announcements.map(item => `
            <article class="announcement-card">

                <div class="announcement-meta">
                    ${formatDate(item.createdAt)}
                    •
                    ${escapeHtml(item.authorName)}
                </div>

                <h2>
                    ${escapeHtml(item.title)}
                </h2>

                <div class="announcement-body">
                    ${formatText(item.content)}
                </div>

                ${
                    item.images?.length
                        ? `
                            <div class="announcement-images">
                                ${item.images.map(src => `
                                    <img
                                        src="${API_URL}${escapeHtml(src)}"
                                        alt=""
                                    >
                                `).join("")}
                            </div>
                        `
                        : ""
                }

                ${
                    staffMe.permissions.announcements.edit
                        ? `
                            <button
                                class="btn btn-danger"
                                onclick="deleteAnnouncement('${item.id}')"
                            >
                                DELETE
                            </button>
                        `
                        : ""
                }

            </article>
        `).join("")
    }

    if (
        staffMe.permissions.announcements.edit &&
        qs("announcement-editor")
    ) {
        qs("announcement-editor").hidden = false
    }
}

async function uploadAnnouncementImages() {
    const input = qs("announcement-images")

    if (!input?.files?.length) {
        return []
    }

    const form = new FormData()

    for (const file of input.files) {
        form.append("images", file)
    }

    const data = await api("/api/staffhub/upload", {
        method: "POST",
        body: form
    })

    return data.urls || []
}

async function publishAnnouncement() {
    const button = event.currentTarget

    if (button) {
        button.disabled = true
    }

    try {
        const images =
            await uploadAnnouncementImages()

        await api("/api/staffhub/announcement", {
            method: "POST",
            body: JSON.stringify({
                title: qs("announcement-title")?.value || "",
                content: qs("announcement-content")?.value || "",
                images
            })
        })

        if (qs("announcement-title")) {
            qs("announcement-title").value = ""
        }

        if (qs("announcement-content")) {
            qs("announcement-content").value = ""
        }

        if (qs("announcement-images")) {
            qs("announcement-images").value = ""
        }

        await loadContent()

        renderAnnouncements()
    } catch (error) {
        alert(error.message)
    } finally {
        if (button) {
            button.disabled = false
        }
    }
}

async function deleteAnnouncement(id) {
    if (!confirm("Delete this announcement?")) {
        return
    }

    try {
        await api(
            `/api/staffhub/announcement/${id}`,
            {
                method: "DELETE"
            }
        )

        await loadContent()

        renderAnnouncements()
    } catch (error) {
        alert(error.message)
    }
}


/* =========================
   CURRENT STAFF
========================= */

async function renderCurrentStaff() {
    const container = qs("current-staff-list")

    if (!container) return

    container.innerHTML = `
        <div class="empty-state">
            Loading current staff...
        </div>
    `

    try {
        const data = await api(
            `/api/staffhub/current-staff?server=${encodeURIComponent(SERVER_SLUG)}`
        )

        const staff = data.staff || []

        if (!staff.length) {
            container.innerHTML = `
                <div class="empty-state">
                    No current staff found.
                </div>
            `

            return
        }

        container.innerHTML = staff.map(member => `
            <article class="staff-card">

                <img
                    class="staff-avatar"
                    src="${escapeHtml(member.avatar || "")}"
                    alt=""
                >

                <div class="staff-card-content">

                    <h2>
                        ${escapeHtml(
                            member.displayName ||
                            member.username ||
                            "Unknown"
                        )}
                    </h2>

                    <div class="staff-card-role">
                        ${escapeHtml(
                            member.levelRole?.name ||
                            member.roleName ||
                            "Staff"
                        )}
                    </div>

                    ${
                        member.staffRoles?.length
                            ? `
                                <div class="staff-card-roles">
                                    ${member.staffRoles
                                        .map(role =>
                                            `<span>
                                                ${escapeHtml(role.name)}
                                            </span>`
                                        )
                                        .join("")}
                                </div>
                            `
                            : ""
                    }

                </div>

            </article>
        `).join("")
    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                ${escapeHtml(error.message)}
            </div>
        `
    }
}


/* =========================
   GENERIC EDITOR HELPERS
========================= */

function closeEditor() {
    if (qs("editor")) {
        qs("editor").hidden = true
    }
}


/* =========================
   GLOBAL ACCESS
========================= */

window.logout = logout

window.openCommandEditor = openCommandEditor
window.closeCommandEditor = closeCommandEditor

window.openCommandPermissions = openCommandPermissions
window.closeCommandPermissions = closeCommandPermissions
window.saveCommandPermissions = saveCommandPermissions

window.addCommandCategory = addCommandCategory
window.editCommandCategory = editCommandCategory
window.deleteCommandCategory = deleteCommandCategory

window.addCommand = addCommand
window.editCommand = editCommand
window.deleteCommand = deleteCommand

window.savePage = savePage
window.closeEditor = closeEditor

window.publishAnnouncement = publishAnnouncement
window.deleteAnnouncement = deleteAnnouncement