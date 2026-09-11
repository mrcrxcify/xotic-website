const API_URL =
    "https://api.xoticesports.com";

const SERVER_SLUG =
    "xotic";

let staffMe = null;
let staffContent = null;
let commandCategories = [];
let commandRoles = [];

const PAGE_INFO = {
    commands: {
        title: "Commands",
        description:
            "Commands available to you based on your staff access.",
        href: "commands.html"
    },

    tickets: {
        title: "Tickets",
        description:
            "The official guide for handling staff tickets.",
        href: "tickets.html"
    },

    etiquette: {
        title: "Etiquette",
        description:
            "Standards and expectations for Xotic staff.",
        href: "etiquette.html"
    },

    announcements: {
        title: "Announcements",
        description:
            "Important internal Xotic staff announcements.",
        href: "announcements.html"
    },

    promosDemos: {
        title: "Promos & Demos",
        description:
            "Staff promotions, hires, removals and demotions.",
        href: "promos-demos.html"
    },

    currentStaff: {
        title: "Current Staff",
        description:
            "View the current Xotic Esports staff hierarchy.",
        href: "current-staff.html"
    }
};

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
    let text = escapeHtml(value ?? "");

    const codeBlocks = [];

    text = text.replace(
        /```([\s\S]*?)```/g,
        (_, code) => {
            const id = `__CODEBLOCK_${codeBlocks.length}__`;

            codeBlocks.push(
                `<pre class="discord-codeblock"><code>${code.trim()}</code></pre>`
            );

            return id;
        }
    );

    const inlineCode = [];

    text = text.replace(
        /`([^`\n]+)`/g,
        (_, code) => {
            const id = `__INLINECODE_${inlineCode.length}__`;

            inlineCode.push(
                `<code class="discord-inline-code">${code}</code>`
            );

            return id;
        }
    );

    text = text
        .replace(
            /\*\*(.+?)\*\*/g,
            "<strong>$1</strong>"
        )
        .replace(
            /__(.+?)__/g,
            "<u>$1</u>"
        )
        .replace(
            /~~(.+?)~~/g,
            "<s>$1</s>"
        )
        .replace(
            /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
            "<em>$1</em>"
        )
        .replace(
            /(?<!_)_([^_\n]+)_(?!_)/g,
            "<em>$1</em>"
        )
        .replace(
            /\n/g,
            "<br>"
        );

    inlineCode.forEach(
        (html, index) => {
            text = text.replace(
                `__INLINECODE_${index}__`,
                html
            );
        }
    );

    codeBlocks.forEach(
        (html, index) => {
            text = text.replace(
                `__CODEBLOCK_${index}__`,
                html
            );
        }
    );

    return text;
}

function formatDate(value) {
    if (!value) {
        return "Unknown date";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Unknown date";
    }

    return date.toLocaleString(
        [],
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}

function pagePermission(
    page,
    type = "view"
) {
    return (
        staffMe?.permissions?.[page]?.[type] === true
    );
}

async function api(
    path,
    options = {}
) {
    const response =
        await fetch(
            `${API_URL}${path}`,
            {
                credentials: "include",
                ...options,

                headers: {
                    ...(options.body instanceof FormData
                        ? {}
                        : {
                            "Content-Type":
                                "application/json"
                        }),

                    ...(options.headers || {})
                }
            }
        );

    let data = {};

    try {
        data =
            await response.json();
    } catch {}

    if (!response.ok) {
        const error =
            new Error(
                data.error ||
                `Request failed (${response.status})`
            );

        error.status =
            response.status;

        throw error;
    }

    return data;
}

/*
==================================================
AUTH
==================================================
*/

if (qs("staff-user")) {
    const avatar =
        staffMe?.user?.avatar ||
        "assets/whitelogo.png";

    const displayName =
        staffMe?.user?.displayName ||
        staffMe?.user?.username ||
        "Unknown User";

    const username =
        staffMe?.user?.username ||
        "";

    qs("staff-user").innerHTML = `
        <span class="staff-user-profile">
            <img
                class="staff-user-avatar"
                src="${escapeHtml(avatar)}"
                alt=""
                onerror="this.onerror=null;this.src='assets/whitelogo.png';"
            >

            <span class="staff-user-details">
                <strong class="staff-user-name">
                    ${escapeHtml(displayName)}
                </strong>

                ${
                    username
                        ? `<span class="staff-user-username">@${escapeHtml(username)}</span>`
                        : `<span class="staff-user-username">Staff Member</span>`
                }
            </span>
        </span>
    `;
}

async function loadContent() {
    staffContent =
        await api(
            "/api/staffhub/content"
        );

    return staffContent;
}

/*
==================================================
NAVIGATION
==================================================
*/

function buildNav() {
    const currentPage =
        document.body.dataset.page;

    document
        .querySelectorAll(
            "[data-page-link]"
        )
        .forEach(link => {
            const page =
                link.dataset.pageLink;

            if (
                page !== "home" &&
                !pagePermission(
                    page,
                    "view"
                )
            ) {
                link.remove();
                return;
            }

            if (
                page === currentPage
            ) {
                link.classList.add(
                    "active"
                );
            }
        });
}

function toggleMobileMenu() {
    const nav =
        qs("staff-nav");

    if (!nav) {
        return;
    }

    nav.classList.toggle(
        "open"
    );
}

function logout() {
    window.location.href =
        `${API_URL}/auth/logout`;
}

function redirectIfNoAccess(page) {
    if (
        pagePermission(
            page,
            "view"
        )
    ) {
        return true;
    }

    document.body.innerHTML = `
        <main class="access-error">
            <div class="container">
                <div class="section-label">
                    ACCESS DENIED
                </div>

                <h1>
                    YOU CANNOT ACCESS THIS PAGE
                </h1>

                <p>
                    You do not currently have permission to view this StaffHub page.
                </p>

                <br>

                <a
                    class="btn"
                    href="index.html">
                    RETURN TO STAFFHUB
                </a>
            </div>
        </main>
    `;

    return false;
}

/*
==================================================
STARTUP
==================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const ok =
            await requireStaff();

        if (!ok) {
            return;
        }

        await loadContent();

        buildNav();

        const page =
            document.body.dataset.page;

        if (!page) {
            return;
        }

        if (
            !redirectIfNoAccess(page)
        ) {
            return;
        }

        if (page === "home") {
            renderHome();
        }

        if (page === "commands") {
            renderCommands();
        }

        if (
            page === "tickets" ||
            page === "etiquette"
        ) {
            renderDocumentPage(page);
        }

        if (
            page === "promosDemos"
        ) {
            renderStaffUpdates();
        }

        if (
            page === "announcements"
        ) {
            renderAnnouncements();
        }

        if (
            page === "currentStaff"
        ) {
            renderCurrentStaff();
        }

    }
);

/*
==================================================
HOME
==================================================
*/

function renderHome() {
    if (qs("home-welcome")) {
        qs("home-welcome").textContent =
            staffMe.user.displayName;
    }

    if (qs("home-role")) {
        qs("home-role").textContent =
            staffMe.staffRoles
                .map(
                    role => role.name
                )
                .join(" • ");
    }

    if (qs("home-level")) {
        qs("home-level").textContent =
            staffMe.level >= 0
                ? `LEVEL ${staffMe.level}`
                : "STAFF";
    }

    const grid =
        qs("home-grid");

    if (!grid) {
        return;
    }

    const pages =
        Object.entries(
            PAGE_INFO
        )
            .filter(
                ([key]) =>
                    pagePermission(
                        key,
                        "view"
                    )
            )
            .map(
                ([key, page]) => ({
                    key,
                    ...page
                })
            );

    if (!pages.length) {
        grid.innerHTML = `
            <div class="empty-state">
                No StaffHub pages are currently available to you.
            </div>
        `;

        return;
    }

    grid.innerHTML =
        pages.map(
            page => `
                <a
                    class="hub-card"
                    href="${page.href}">

                    <div class="hub-card-label">
                        ${escapeHtml(
                            page.title
                        )}
                    </div>

                    <h2>
                        ${escapeHtml(
                            page.title
                        )}
                    </h2>

                    <p>
                        ${escapeHtml(
                            page.description
                        )}
                    </p>

                    <span class="hub-card-arrow">
                        OPEN →
                    </span>
                </a>
            `
        ).join("");
}

/*
==================================================
IMAGE UPLOAD
==================================================
*/

async function uploadImages(
    files,
    page
) {
    const images = [];

    for (
        const file
        of files
    ) {
        if (
            !file.type.startsWith(
                "image/"
            )
        ) {
            continue;
        }

        if (
            file.size >
            8 * 1024 * 1024
        ) {
            alert(
                `${file.name} is larger than 8MB.`
            );

            continue;
        }

        const data =
            await new Promise(
                (resolve, reject) => {
                    const reader =
                        new FileReader();

                    reader.onload =
                        () =>
                            resolve(
                                reader.result
                            );

                    reader.onerror =
                        reject;

                    reader.readAsDataURL(
                        file
                    );
                }
            );

        const result =
            await api(
                "/api/staffhub/upload",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            page,
                            name:
                                file.name,
                            data
                        })
                }
            );

        images.push(
            result.attachment
        );
    }

    return images;
}
async function uploadAttachments(files, page) {
    const attachments = [];

    for (const file of files) {
        if (file.size > 8 * 1024 * 1024) {
            alert(`${file.name} is larger than 8MB.`);
            continue;
        }

        const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;

            reader.readAsDataURL(file);
        });

        const result = await api(
            "/api/staffhub/upload",
            {
                method: "POST",
                body: JSON.stringify({
                    page,
                    name: file.name,
                    type: file.type,
                    data
                })
            }
        );

        if (!result?.attachment?.url) {
            throw new Error(
                `Upload failed for ${file.name}.`
            );
        }

        attachments.push(
            result.attachment
        );
    }

    return attachments;
}
/* ==================================================
   ATTACHMENTS
================================================== */

function getAttachments(item) {
    if (!item || typeof item !== "object") {
        return [];
    }

    if (Array.isArray(item.attachments)) {
        return item.attachments.filter(
            attachment =>
                attachment &&
                typeof attachment.url === "string" &&
                attachment.url
        );
    }

    if (Array.isArray(item.images)) {
        return item.images
            .filter(image => image)
            .map(image => {
                if (typeof image === "string") {
                    return {
                        id: crypto.randomUUID
                            ? crypto.randomUUID()
                            : `image-${Date.now()}-${Math.random()}`,
                        url: image,
                        name: "Image",
                        type: "image/*",
                        size: 0
                    };
                }

                return {
                    id:
                        image.id ||
                        `image-${Date.now()}-${Math.random()}`,
                    url: image.url,
                    name:
                        image.name ||
                        "Image",
                    type:
                        image.type ||
                        "image/*",
                    size:
                        Number(image.size) || 0
                };
            })
            .filter(image => image.url);
    }

    return [];
}


function getAttachmentUrl(url) {
    if (!url) {
        return "";
    }

    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:")
    ) {
        return url;
    }

    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}


function renderAttachments(attachments) {
    if (
        !Array.isArray(attachments) ||
        !attachments.length
    ) {
        return "";
    }

    return `
        <div class="document-attachments">

            ${attachments
                .map(attachment => {
                    const url =
                        getAttachmentUrl(
                            attachment.url
                        );

                    const type =
                        String(
                            attachment.type || ""
                        ).toLowerCase();

                    const isImage =
                        type.startsWith("image/") ||
                        /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(
                            attachment.name || ""
                        );

                    if (isImage) {
                        return `
                            <div
                                class="attachment-card">

                                <div
                                    class="attachment-thumbnail"
                                    onclick="openImageViewer(
                                        '${escapeHtml(url)}'
                                    )">

                                    <img
                                        src="${escapeHtml(url)}"
                                        alt="${escapeHtml(
                                            attachment.name ||
                                            "Image"
                                        )}"
                                        loading="lazy">

                                </div>

                                <div class="attachment-card-info">

                                    <strong>
                                        ${escapeHtml(
                                            attachment.name ||
                                            "Image"
                                        )}
                                    </strong>

                                    ${
                                        attachment.size
                                            ? `
                                                <span>
                                                    ${formatFileSize(
                                                        attachment.size
                                                    )}
                                                </span>
                                            `
                                            : ""
                                    }

                                </div>

                            </div>
                        `;
                    }

                    return `
                        <a
                            class="attachment-card attachment-file-card"
                            href="${escapeHtml(url)}"
                            target="_blank"
                            rel="noopener noreferrer">

                            <div class="attachment-file-icon">
                                FILE
                            </div>

                            <div class="attachment-card-info">

                                <strong>
                                    ${escapeHtml(
                                        attachment.name ||
                                        "Attachment"
                                    )}
                                </strong>

                                ${
                                    attachment.size
                                        ? `
                                            <span>
                                                ${formatFileSize(
                                                    attachment.size
                                                )}
                                            </span>
                                        `
                                        : ""
                                }

                            </div>

                            <span class="attachment-open">
                                OPEN →
                            </span>

                        </a>
                    `;
                })
                .join("")}

        </div>
    `;
}


function formatFileSize(bytes) {
    const size = Number(bytes);

    if (!Number.isFinite(size) || size <= 0) {
        return "";
    }

    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
/* ==================================================
   IMAGE VIEWER
================================================== */

function openImageViewer(url) {
    if (!url) {
        return;
    }

    let viewer = qs("image-viewer");

    if (!viewer) {
        viewer = document.createElement("div");

        viewer.id = "image-viewer";
        viewer.className = "image-viewer";

        viewer.innerHTML = `
            <button
                type="button"
                class="image-viewer-close"
                aria-label="Close image"
                onclick="closeImageViewer()">
                ×
            </button>

            <img
                id="image-viewer-image"
                src=""
                alt=""
                onclick="event.stopPropagation()"
            >
        `;

        viewer.addEventListener(
            "click",
            event => {
                if (
                    event.target === viewer
                ) {
                    closeImageViewer();
                }
            }
        );

        document.body.appendChild(viewer);
    }

    const image =
        qs("image-viewer-image");

    image.src = url;

    viewer.classList.add("open");

    document.body.classList.add(
        "image-viewer-open"
    );
}


function closeImageViewer() {
    const viewer =
        qs("image-viewer");

    if (!viewer) {
        return;
    }

    viewer.classList.remove("open");

    document.body.classList.remove(
        "image-viewer-open"
    );

    const image =
        qs("image-viewer-image");

    if (image) {
        image.src = "";
    }
}


document.addEventListener(
    "keydown",
    event => {
        if (
            event.key === "Escape"
        ) {
            closeImageViewer();
        }
    }
);
/*
==================================================
DOCUMENT PAGES
==================================================
*/

async function renderDocumentPage(
    pageName
) {
    const list =
        qs(
            `${pageName === "promosDemos"
                ? "promos-demos-list"
                : `${pageName}-list`}`
        );

    if (!list) {
        return;
    }

    try {
        const data =
            await api(
                `/api/staffhub/${pageName}`
            );

        const page =
            data.page;

        renderDocument(
            list,
            page
        );

        const editButton =
            qs(
                pageName === "promosDemos"
                    ? "promos-demos-edit-button"
                    : `${pageName}-edit-button`
            );

        const permissionButton =
            qs(
                pageName === "promosDemos"
                    ? "promos-demos-permissions-button"
                    : `${pageName}-permissions-button`
            );

        if (
            editButton &&
            pagePermission(
                pageName,
                "edit"
            )
        ) {
            editButton.hidden =
                false;
        }

        if (
            permissionButton &&
            staffMe.founder
        ) {
            permissionButton.hidden =
                false;
        }

        if (
            pageName ===
            "promosDemos"
        ) {
            renderStaffUpdates();
        }
    } catch (error) {
        list.innerHTML = `
            <div class="empty-state">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}

function renderDocument(
    container,
    page
) {
    const categories =
        Array.isArray(
            page?.categories
        )
            ? page.categories
            : [];

    if (!categories.length) {
        container.innerHTML = `
            <div class="empty-state">
                Nothing has been added here yet.
            </div>
        `;

        return;
    }

    container.innerHTML =
        categories.map(
            category => `
                <article class="document-category">

                    <div class="section-label">
                        ${escapeHtml(
                            category.title ||
                            category.name ||
                            "CATEGORY"
                        )}
                    </div>

                    <h2>
                        ${escapeHtml(
                            category.title ||
                            category.name ||
                            "Untitled"
                        )}
                    </h2>

                    ${
                        category.description
                            ? `
                                <div class="document-category-description">
                                    ${formatText(
                                        category.description
                                    )}
                                </div>
                            `
                            : ""
                    }

                    ${
                        category.content
                            ? `
                                <div class="document-content">
                                    ${formatText(
                                        category.content
                                    )}
                                </div>
                            `
                            : ""
                    }

                    ${renderAttachments(
                        getAttachments(category)
                    )   }
                </article>
            `
        ).join("");
}

/*
==================================================
DOCUMENT EDITOR
==================================================
*/

async function openDocumentEditor(
    pageName
) {
    if (
        !pagePermission(
            pageName,
            "edit"
        )
    ) {
        return;
    }

    const editorId =
        pageName === "promosDemos"
            ? "promos-demos-editor"
            : `${pageName}-editor`;

    const editor =
        qs(editorId);

    if (!editor) {
        return;
    }

    editor.hidden = false;

    const data =
        await api(
            `/api/staffhub/${pageName}`
        );

    renderDocumentEditor(
        pageName,
        data.page
    );

    editor.scrollIntoView({
        behavior: "smooth"
    });
}

function renderDocumentEditor(
    pageName,
    page
) {
    const editorId =
        pageName === "promosDemos"
            ? "promos-demos-editor"
            : `${pageName}-editor`;

    const editor =
        qs(editorId);

    if (!editor) {
        return;
    }

    const categories =
        Array.isArray(
            page?.categories
        )
            ? page.categories
            : [];

    editor.innerHTML = `
        <div class="editor-panel">

            <div class="editor-header">

                <div>
                    <div class="section-label">
                        ${escapeHtml(
                            PAGE_INFO[
                                pageName
                            ].title
                        ).toUpperCase()}
                        EDITOR
                    </div>

                    <h2>
                        Manage Content
                    </h2>

                    <p>
                        Create categories, text and images.
                    </p>
                </div>

                <button
                    class="btn"
                    onclick="closeDocumentEditor('${pageName}')">
                    CLOSE
                </button>

            </div>

            <div>
                <button
                    class="btn"
                    onclick="addDocumentCategory('${pageName}')">
                    ADD CATEGORY
                </button>
            </div>

            <div id="${pageName}-editor-categories">

                ${
                    categories.length
                        ? categories
                            .map(
                                category =>
                                    documentCategoryEditorHtml(
                                        pageName,
                                        category
                                    )
                            )
                            .join("")
                        : `
                            <div class="empty-state" style="margin-top:15px">
                                No categories yet.
                            </div>
                        `
                }

            </div>

        </div>
    `;
}
/* ==================================================
   TICKETS / ETIQUETTE EDITOR HELPERS
================================================== */

function openTicketsEditor() {
    return openDocumentEditor(
        "tickets"
    );
}


function closeTicketsEditor() {
    return closeDocumentEditor(
        "tickets"
    );
}


function openTicketsPermissions() {
    return openPagePermissions(
        "tickets"
    );
}


function closeTicketsPermissions() {
    const section =
        qs("tickets-permissions");

    if (section) {
        section.hidden = true;
    }
}


function openEtiquetteEditor() {
    return openDocumentEditor(
        "etiquette"
    );
}


function closeEtiquetteEditor() {
    return closeDocumentEditor(
        "etiquette"
    );
}


function openEtiquettePermissions() {
    return openPagePermissions(
        "etiquette"
    );
}


function closeEtiquettePermissions() {
    const section =
        qs("etiquette-permissions");

    if (section) {
        section.hidden = true;
    }
}
function documentCategoryEditorHtml(pageName, category) {
    const attachments = getAttachments(category);

    return `
        <div
            class="editor-category"
            id="category-${escapeHtml(category.id)}">

            <div class="editor-category-header">

                <div style="flex:1">
                    <label>
                        Category title
                    </label>

                    <input
                        id="title-${escapeHtml(category.id)}"
                        value="${escapeHtml(
                            category.title ||
                            category.name ||
                            ""
                        )}">
                </div>

                <div class="editor-actions">

                    <button
                        class="btn"
                        type="button"
                        onclick="saveDocumentCategory(
                            '${escapeHtml(pageName)}',
                            '${escapeHtml(category.id)}'
                        )">
                        SAVE
                    </button>

                    <button
                        class="btn btn-danger"
                        type="button"
                        onclick="deleteDocumentCategory(
                            '${escapeHtml(pageName)}',
                            '${escapeHtml(category.id)}'
                        )">
                        DELETE
                    </button>

                </div>

            </div>

            <div class="form-grid" style="margin-top:15px">

                <div class="form-full">

                    <label>
                        Description
                    </label>

                    <textarea
                        id="description-${escapeHtml(category.id)}"
                        style="min-height:100px">${escapeHtml(
                            category.description || ""
                        )}</textarea>

                </div>

                <div class="form-full">

                    <label>
                        Content
                    </label>

                    <textarea
                        id="content-${escapeHtml(category.id)}"
                        style="min-height:220px">${escapeHtml(
                            category.content || ""
                        )}</textarea>

                    <small class="editor-help">
                        Supports Discord formatting:
                        **bold**, *italic*, ~~strikethrough~~,
                        __underline__, \`code\`, and code blocks.
                    </small>

                </div>

                <div class="form-full">

                    <label>
                        ATTACHMENTS
                    </label>

                    <input
                        id="document-files-${escapeHtml(category.id)}"
                        type="file"
                        multiple
                        onchange="handleDocumentAttachments(
                            '${escapeHtml(pageName)}',
                            '${escapeHtml(category.id)}',
                            this.files
                        )">

                    <div
                        id="attachments-${escapeHtml(category.id)}"
                        class="editor-attachment-list">

                        ${renderEditorAttachments(
                            attachments,
                            category.id
                        )}

                    </div>

                    <input
                        type="hidden"
                        id="attachment-data-${escapeHtml(category.id)}"
                        value="${escapeHtml(
                            JSON.stringify(attachments)
                        )}">

                </div>

            </div>

        </div>
    `;
}

async function handleDocumentAttachments(
    pageName,
    categoryId,
    files
) {
    try {
        const uploaded =
            await uploadAttachments(
                [...files],
                pageName
            );

        const input =
            qs(
                `attachment-data-${categoryId}`
            );

        if (!input) {
            return;
        }

        let existing = [];

        try {
            existing =
                JSON.parse(
                    input.value || "[]"
                );
        } catch {
            existing = [];
        }

        input.value =
            JSON.stringify(
                existing.concat(uploaded)
            );

        renderEditorAttachments(
            categoryId
        );

    } catch (error) {
        alert(error.message);
    }
}


function renderEditorAttachments(categoryId) {
    const input =
        qs(
            `attachment-data-${categoryId}`
        );

    const container =
        qs(
            `attachments-${categoryId}`
        );

    if (!input || !container) {
        return;
    }

    let attachments = [];

    try {
        attachments =
            JSON.parse(
                input.value || "[]"
            );
    } catch {
        attachments = [];
    }

    container.innerHTML =
        renderEditorAttachmentsHtml(
            attachments,
            categoryId
        );
}


function renderEditorAttachmentsHtml(
    attachments,
    categoryId
) {
    if (
        !Array.isArray(attachments) ||
        !attachments.length
    ) {
        return `
            <div class="empty-state">
                No attachments added.
            </div>
        `;
    }

    return attachments
        .map(
            attachment => {
                const url =
                    getAttachmentUrl(
                        attachment.url
                    );

                const type =
                    String(
                        attachment.type || ""
                    ).toLowerCase();

                const isImage =
                    type.startsWith("image/") ||
                    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(
                        attachment.name || ""
                    );

                return `
                    <div
                        class="editor-attachment"
                        data-attachment-id="${escapeHtml(
                            attachment.id
                        )}">

                        <div class="editor-attachment-preview">

                            ${
                                isImage
                                    ? `
                                        <img
                                            src="${escapeHtml(url)}"
                                            alt="${escapeHtml(
                                                attachment.name ||
                                                "Attachment"
                                            )}"
                                            onclick="openImageViewer(
                                                '${escapeHtml(url)}'
                                            )">
                                    `
                                    : `
                                        <div class="editor-file-icon">
                                            FILE
                                        </div>
                                    `
                            }

                        </div>

                        <div class="editor-attachment-info">

                            <strong>
                                ${escapeHtml(
                                    attachment.name ||
                                    "Attachment"
                                )}
                            </strong>

                            ${
                                attachment.size
                                    ? `
                                        <span>
                                            ${formatFileSize(
                                                attachment.size
                                            )}
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                        <button
                            type="button"
                            class="btn btn-danger"
                            onclick="removeDocumentAttachment(
                                '${escapeHtml(categoryId)}',
                                '${escapeHtml(
                                    attachment.id
                                )}'
                            )">
                            REMOVE
                        </button>

                    </div>
                `;
            }
        )
        .join("");
}


function renderEditorAttachments(
    attachments,
    categoryId
) {
    return renderEditorAttachmentsHtml(
        attachments,
        categoryId
    );
}


function removeDocumentAttachment(
    categoryId,
    attachmentId
) {
    const input =
        qs(
            `attachment-data-${categoryId}`
        );

    if (!input) {
        return;
    }

    let attachments = [];

    try {
        attachments =
            JSON.parse(
                input.value || "[]"
            );
    } catch {
        attachments = [];
    }

    attachments =
        attachments.filter(
            attachment =>
                attachment.id !==
                attachmentId
        );

    input.value =
        JSON.stringify(
            attachments
        );

    renderEditorAttachments(
        categoryId
    );
}

async function addDocumentCategory(
    pageName
) {
    try {
        const data =
            await api(
                `/api/staffhub/${pageName}`
            );

        const page =
            data.page;

        const categories =
            Array.isArray(
                page.categories
            )
                ? page.categories
                : [];

        categories.push({
            id:
                crypto.randomUUID
                    ? crypto.randomUUID()
                    : Date.now().toString(),

            title:
                "New Category",

            description:
                "",

            content:
                "",

            images: [],
            attachments: []
        });

        await saveDocumentPage(
            pageName,
            categories
        );

        renderDocumentEditor(
            pageName,
            {
                categories
            }
        );

        renderDocumentPage(
            pageName
        );
    } catch (error) {
        alert(error.message);
    }
}

async function saveDocumentCategory(
    pageName,
    categoryId
) {
    try {
        const data =
            await api(
                `/api/staffhub/${pageName}`
            );

        const categories =
            data.page.categories || [];

        const category =
            categories.find(
                item =>
                    item.id ===
                    categoryId
            );

        if (!category) {
            return;
        }

        category.title =
            qs(
                `title-${categoryId}`
            ).value.trim();

        category.description =
            qs(
                `description-${categoryId}`
            ).value;

        category.content =
            qs(
                `content-${categoryId}`
            ).value;

        category.attachments =
    JSON.parse(
        qs(
            `attachment-data-${categoryId}`
        ).value || "[]"
    );

category.images =
    category.attachments.filter(
        attachment =>
            String(
                attachment.type || ""
            ).startsWith("image/")
    );

        await saveDocumentPage(
            pageName,
            categories
        );

        alert(
            "Category saved."
        );

        renderDocumentPage(
            pageName
        );
    } catch (error) {
        alert(error.message);
    }
}

async function deleteDocumentCategory(
    pageName,
    categoryId
) {
    if (
        !confirm(
            "Delete this category?"
        )
    ) {
        return;
    }

    try {
        const data =
            await api(
                `/api/staffhub/${pageName}`
            );

        const categories =
            (
                data.page.categories ||
                []
            ).filter(
                category =>
                    category.id !==
                    categoryId
            );

        await saveDocumentPage(
            pageName,
            categories
        );

        renderDocumentEditor(
            pageName,
            {
                categories
            }
        );

        renderDocumentPage(
            pageName
        );
    } catch (error) {
        alert(error.message);
    }
}

async function saveDocumentPage(
    pageName,
    categories
) {
    return api(
        `/api/staffhub/${pageName}`,
        {
            method: "PUT",

            body:
                JSON.stringify({
                    categories
                })
        }
    );
}

function closeDocumentEditor(
    pageName
) {
    const id =
        pageName === "promosDemos"
            ? "promos-demos-editor"
            : `${pageName}-editor`;

    const editor =
        qs(id);

    if (editor) {
        editor.hidden = true;
    }
}





/*
==================================================
ANNOUNCEMENTS
==================================================
*/  

async function renderAnnouncements() {
    const list =
        qs(
            "announcements-list"
        );

    if (!list) {
        return;
    }

    try {
        const data =
            await api(
                "/api/staffhub/announcements"
            );

        const announcements =
            data.announcements || [];

        if (!announcements.length) {
            list.innerHTML = `
                <div class="empty-state">
                    No announcements have been posted yet.
                </div>
            `;
        } else {
            list.innerHTML =
                announcements
                    .map(
                        item =>
                            announcementHtml(
                                item
                            )
                    )
                    .join("");
        }

        if (
            pagePermission(
                "announcements",
                "edit"
            )
        ) {
            qs(
                "announcements-edit-button"
            ).hidden = false;
        }

        if (
            staffMe.founder
        ) {
            qs(
                "announcements-permissions-button"
            ).hidden = false;
        }
    } catch (error) {
        list.innerHTML = `
            <div class="empty-state">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}

function announcementHtml(
    item
) {
    return `
        <article
            class="announcement-card">

            <div class="announcement-top">

                <div>
                    <div class="section-label">
                        STAFF ANNOUNCEMENT
                    </div>

                    <h2>
                        ${escapeHtml(
                            item.title
                        )}
                    </h2>
                </div>

                <div class="announcement-meta">
                    ${escapeHtml(
                        item.author?.displayName ||
                        item.author?.username ||
                        "Unknown"
                    )}

                    <br>

                    ${escapeHtml(
                        formatDate(
                            item.date
                        )
                    )}
                </div>

            </div>

            <div class="announcement-body">
                ${formatText(
                    item.content
                )}
            </div>

            ${renderAttachments(
    getAttachments(item)
)}

            ${
                pagePermission(
                    "announcements",
                    "edit"
                )
                    ? `
                        <div class="form-actions">
                            <button
                                class="btn"
                                onclick="editAnnouncement(
                                    '${item.id}'
                                )">
                                EDIT
                            </button>

                            <button
                                class="btn btn-danger"
                                onclick="deleteAnnouncement(
                                    '${item.id}'
                                )">
                                DELETE
                            </button>
                        </div>
                    `
                    : ""
            }

        </article>
    `;
}

function openAnnouncementsEditor() {
    const editor =
        qs(
            "announcements-editor"
        );

    if (!editor) {
        return;
    }

    editor.hidden = false;

    editor.innerHTML = `
        <div class="editor-panel">

            <div class="editor-header">
                <div>
                    <div class="section-label">
                        ANNOUNCEMENT EDITOR
                    </div>

                    <h2>
                        Create Announcement
                    </h2>

                    <p>
                        Publish an announcement for staff.
                    </p>
                </div>

                <button
                    class="btn"
                    onclick="closeAnnouncementsEditor()">
                    CLOSE
                </button>
            </div>

            <div class="form-grid">

                <div class="form-full">
                    <label>
                        Title
                    </label>

                    <input
                        id="announcement-title">
                </div>

                <div class="form-full">
                    <label>
                        Content
                    </label>

                    <textarea
                        id="announcement-content"></textarea>
                </div>

                <div class="form-full">
                    <label>
                        Images
                    </label>

                    <input
                        id="announcement-files"
                        type="file"
                        accept="image/*"
                        multiple
                        onchange="previewAnnouncementFiles(this.files)">

                    <div
                        id="announcement-images-preview"
                        class="image-preview">
                    </div>
                </div>

            </div>

            <div class="form-actions">
                <button
                    class="btn"
                    onclick="createAnnouncement()">
                    PUBLISH
                </button>
            </div>

        </div>
    `;

    editor.scrollIntoView({
        behavior: "smooth"
    });
}

function closeAnnouncementsEditor() {
    const editor =
        qs(
            "announcements-editor"
        );

    if (editor) {
        editor.hidden = true;
    }
}

function previewAnnouncementFiles(
    files
) {
    const preview =
        qs(
            "announcement-images-preview"
        );

    if (!preview) {
        return;
    }

    preview.innerHTML =
        [...files]
            .map(
                file => `
                    <div class="image-item">
                        <img
                            src="${URL.createObjectURL(
                                file
                            )}"
                            alt="">
                    </div>
                `
            )
            .join("");
}

async function createAnnouncement() {
    if (announcementSaving) {
        return;
    }

    try {
        const title =
            qs("announcement-title")
                ?.value
                .trim();

        const content =
            qs("announcement-content")
                ?.value
                .trim();

        if (!title || !content) {
            alert(
                "Title and content are required."
            );

            return;
        }

        const files = [
            ...(qs(
                "announcement-files"
            )?.files || [])
        ];

        const button =
            document.querySelector(
                "#announcements-editor .btn:not(.btn-secondary)"
            );

        announcementSaving = true;

        if (button) {
            button.disabled = true;
            button.textContent = "PUBLISHING...";
        }

        const attachments =
            await uploadAttachments(
                files,
                "announcements"
            );

        await api(
            "/api/staffhub/announcements",
            {
                method: "POST",

                body:
                    JSON.stringify({
                        title,
                        content,
                        attachments
                    })
            }
        );

        closeAnnouncementsEditor();

        await renderAnnouncements();

    } catch (error) {
        alert(error.message);

    } finally {
        announcementSaving = false;
    }
}

let announcementSaving = false;

async function editAnnouncement(id) {
    try {
        const data = await api(
            "/api/staffhub/announcements"
        );

        const item =
            (data.announcements || [])
                .find(
                    announcement =>
                        announcement.id === id
                );

        if (!item) {
            return;
        }

        const editor =
            qs("announcements-editor");

        if (!editor) {
            return;
        }

        const attachments =
            getAttachments(item);

        editor.hidden = false;

        editor.innerHTML = `
            <div class="editor-panel">

                <div class="editor-header">

                    <div>
                        <div class="section-label">
                            ANNOUNCEMENT EDITOR
                        </div>

                        <h2>
                            Edit Announcement
                        </h2>

                        <p>
                            Edit the announcement and its attachments.
                        </p>
                    </div>

                    <button
                        class="btn btn-secondary"
                        type="button"
                        onclick="closeAnnouncementsEditor()">
                        CLOSE
                    </button>

                </div>

                <div class="form-grid">

                    <div class="form-full">

                        <label>
                            TITLE
                        </label>

                        <input
                            id="announcement-title"
                            value="${escapeHtml(
                                item.title
                            )}">
                    </div>

                    <div class="form-full">

                        <label>
                            CONTENT
                        </label>

                        <textarea
                            id="announcement-content"
                            style="min-height:220px">${escapeHtml(
                                item.content || ""
                            )}</textarea>

                        <small class="editor-help">
                            Supports Discord formatting:
                            **bold**, *italic*, ~~strikethrough~~,
                            __underline__, \`code\`, and code blocks.
                        </small>

                    </div>

                    <div class="form-full">

                        <label>
                            ATTACHMENTS
                        </label>

                        <input
                            id="announcement-files"
                            type="file"
                            multiple
                            onchange="handleAnnouncementAttachments(this.files)">

                        <div
                            id="announcement-images-preview"
                            class="image-preview">

                            ${attachments.map(
                                attachment => `
                                    <div
                                        class="image-item"
                                        data-attachment-id="${escapeHtml(
                                            attachment.id
                                        )}">

                                        ${
                                            attachment.type?.startsWith(
                                                "image/"
                                            )
                                                ? `
                                                    <img
                                                        src="${escapeHtml(
                                                            attachment.url
                                                        )}"
                                                        alt="${escapeHtml(
                                                            attachment.name
                                                        )}">
                                                `
                                                : `
                                                    <div class="attachment-file-preview">
                                                        ${escapeHtml(
                                                            attachment.name
                                                        )}
                                                    </div>
                                                `
                                        }

                                        <button
                                            type="button"
                                            onclick="removeAnnouncementAttachment(
                                                '${escapeHtml(
                                                    attachment.id
                                                )}'
                                            )">
                                            ×
                                        </button>

                                    </div>
                                `
                            ).join("")}

                        </div>

                        <input
                            type="hidden"
                            id="announcement-attachment-data"
                            value="${escapeHtml(
                                JSON.stringify(
                                    attachments
                                )
                            )}">
                    </div>

                </div>

                <div class="form-actions">

                    <button
                        id="announcement-save-button"
                        class="btn"
                        type="button"
                        onclick="saveAnnouncementEdit(
                            '${escapeHtml(id)}'
                        )">
                        SAVE CHANGES
                    </button>

                </div>

            </div>
        `;

        editor.scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {
        alert(error.message);
    }
}
async function handleAnnouncementAttachments(files) {
    try {
        const uploaded =
            await uploadAttachments(
                [...files],
                "announcements"
            );

        const input =
            qs("announcement-attachment-data");

        if (!input) {
            return;
        }

        let existing = [];

        try {
            existing =
                JSON.parse(
                    input.value || "[]"
                );
        } catch {
            existing = [];
        }

        input.value =
            JSON.stringify(
                existing.concat(uploaded)
            );

        renderAnnouncementAttachmentPreview();

    } catch (error) {
        alert(error.message);
    }
}

function removeAnnouncementAttachment(id) {
    const input =
        qs("announcement-attachment-data");

    if (!input) {
        return;
    }

    let attachments = [];

    try {
        attachments =
            JSON.parse(
                input.value || "[]"
            );
    } catch {
        attachments = [];
    }

    attachments =
        attachments.filter(
            attachment =>
                attachment.id !== id
        );

    input.value =
        JSON.stringify(
            attachments
        );

    renderAnnouncementAttachmentPreview();
}

function renderAnnouncementAttachmentPreview() {
    const input =
        qs("announcement-attachment-data");

    const preview =
        qs("announcement-images-preview");

    if (!input || !preview) {
        return;
    }

    let attachments = [];

    try {
        attachments =
            JSON.parse(
                input.value || "[]"
            );
    } catch {
        attachments = [];
    }

    preview.innerHTML =
        attachments.map(
            attachment => `
                <div
                    class="image-item"
                    data-attachment-id="${escapeHtml(
                        attachment.id
                    )}">

                    ${
                        attachment.type?.startsWith(
                            "image/"
                        )
                            ? `
                                <img
                                    src="${escapeHtml(
                                        attachment.url
                                    )}"
                                    alt="${escapeHtml(
                                        attachment.name
                                    )}">
                            `
                            : `
                                <div class="attachment-file-preview">
                                    ${escapeHtml(
                                        attachment.name
                                    )}
                                </div>
                            `
                    }

                    <button
                        type="button"
                        onclick="removeAnnouncementAttachment(
                            '${escapeHtml(
                                attachment.id
                            )}'
                        )">
                        ×
                    </button>

                </div>
            `
        ).join("");
}

async function saveAnnouncementEdit(id) {
    if (announcementSaving) {
        return;
    }

    const titleInput =
        qs("announcement-title");

    const contentInput =
        qs("announcement-content");

    const attachmentInput =
        qs("announcement-attachment-data");

    if (
        !titleInput ||
        !contentInput
    ) {
        return;
    }

    const title =
        titleInput.value.trim();

    const content =
        contentInput.value.trim();

    if (!title || !content) {
        alert(
            "Title and content are required."
        );

        return;
    }

    let attachments = [];

    try {
        attachments =
            JSON.parse(
                attachmentInput?.value ||
                "[]"
            );
    } catch {
        attachments = [];
    }

    const button =
        qs("announcement-save-button");

    announcementSaving = true;

    if (button) {
        button.disabled = true;
        button.textContent = "SAVING...";
    }

    try {
        await api(
            `/api/staffhub/announcements/${id}`,
            {
                method: "PUT",

                body:
                    JSON.stringify({
                        title,
                        content,
                        attachments
                    })
            }
        );

        await renderAnnouncements();

        const editor =
            qs("announcements-editor");

        if (editor) {
            editor.hidden = true;
            editor.innerHTML = "";
        }

    } catch (error) {
        alert(error.message);

        if (button) {
            button.disabled = false;
            button.textContent =
                "SAVE CHANGES";
        }

    } finally {
        announcementSaving = false;
    }
}
async function deleteAnnouncement(
    id
) {
    if (
        !confirm(
            "Delete this announcement?"
        )
    ) {
        return;
    }

    try {
        await api(
            `/api/staffhub/announcements/${id}`,
            {
                method: "DELETE"
            }
        );

        renderAnnouncements();
    } catch (error) {
        alert(error.message);
    }
}

/*
==================================================
COMMANDS
==================================================
*/

async function loadCommands() {
    const data =
        await api(
            "/api/staffhub/commands"
        );

    commandCategories =
        data.categories || [];

    return data;
}

async function renderCommands() {
    const list =
        qs("commands-list");

    if (!list) {
        return;
    }

    try {
        const data =
            await loadCommands();

        if (!commandCategories.length) {
            list.innerHTML = `
                <div class="empty-state">
                    No command categories have been added yet.
                </div>
            `;
        } else {
            list.innerHTML =
                commandCategories
                    .map(
                        category => `
                            <section
                                class="command-category">

                                <div class="section-label">
                                    COMMAND CATEGORY
                                </div>

                                <h2>
                                    ${escapeHtml(
                                        category.title ||
                                        category.name
                                    )}
                                </h2>

                                ${
                                    category.description
                                        ? `
                                            <p>
                                                ${formatText(
                                                    category.description
                                                )}
                                            </p>
                                        `
                                        : ""
                                }

                                <div
                                    class="command-list"
                                    style="margin-top:18px">

                                    ${
                                        category.commands?.length
                                            ? category.commands
                                                .map(
                                                    command => `
                                                        <article
                                                            class="command-card">

                                                            <code>
                                                                ${escapeHtml(
                                                                    command.command
                                                                )}
                                                            </code>

                                                            <p>
                                                                ${formatText(
                                                                    command.description
                                                                )}
                                                            </p>

                                                           
                                                        </article>
                                                    `
                                                )
                                                .join("")
                                            : `
                                                <div class="empty-state">
                                                    No commands available in this category.
                                                </div>
                                            `
                                    }

                                </div>

                            </section>
                        `
                    )
                    .join("");
        }

        if (
            pagePermission(
                "commands",
                "edit"
            )
        ) {
            qs(
                "commands-edit-button"
            ).hidden = false;
        }

        if (
            staffMe.founder
        ) {
            qs(
                "commands-permissions-button"
            ).hidden = false;
        }
    } catch (error) {
        list.innerHTML = `
            <div class="empty-state">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}

function formatCommandAudience(
    audience
) {
    if (!audience) {
        return "STAFF ACCESS";
    }

    if (
        audience.type ===
        "everyone"
    ) {
        return "AVAILABLE TO EVERYONE";
    }

    if (
        audience.type ===
        "staff"
    ) {
        return "AVAILABLE TO ALL STAFF";
    }

    if (
        audience.type ===
        "roles"
    ) {
        const names =
            (audience.roles || [])
                .map(
                    id => {
                        const role =
                            commandRoles.find(
                                item =>
                                    item.id ===
                                    id
                            );

                        return role
                            ? role.name
                            : id;
                    }
                );

        return `AVAILABLE TO: ${names.join(
            ", "
        )}`;
    }

    return "STAFF ACCESS";
}

async function openCommandEditor() {
    const editor =
        qs("command-editor");

    if (!editor) {
        return;
    }

    editor.hidden = false;

    await loadCommands();

    await loadCommandRoles();

    renderCommandEditor();

    editor.scrollIntoView({
        behavior: "smooth"
    });
}

function closeCommandEditor() {
    const editor =
        qs("command-editor");

    if (editor) {
        editor.hidden = true;
    }
}

async function loadCommandRoles() {
    const data =
        await api(
            "/api/staffhub/roles"
        );

    commandRoles =
        (data.roles || [])
            .filter(
                role =>
                    !role.managed
            )
            .sort(
                (a, b) =>
                    b.position -
                    a.position
            );

    return commandRoles;
}

function renderCommandEditor() {
    const container =
        qs(
            "command-editor-list"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div style="margin-bottom:15px">

            <button
                class="btn"
                onclick="addCommandCategory()">
                ADD CATEGORY
            </button>

        </div>

        ${
            commandCategories.length
                ? commandCategories
                    .map(
                        category =>
                            `
                                <section class="editor-category">

                                    <div class="editor-category-header">

                                        <div>
                                            <h3>
                                                ${escapeHtml(
                                                    category.title ||
                                                    category.name
                                                )}
                                            </h3>

                                            <p style="margin-top:6px;color:var(--gray);font-size:12px">
                                                ${formatText(
                                                    category.description ||
                                                    ""
                                                )}
                                            </p>
                                        </div>

                                        <div class="editor-actions">

                                            <button
                                                class="btn"
                                                onclick="editCommandCategory(
                                                    '${category.id}'
                                                )">
                                                EDIT
                                            </button>

                                            <button
                                                class="btn btn-danger"
                                                onclick="deleteCommandCategory(
                                                    '${category.id}'
                                                )">
                                                DELETE
                                            </button>

                                        </div>

                                    </div>

                                    <div
                                        class="editor-command-list">

                                        ${
                                            category.commands?.length
                                                ? category.commands
                                                    .map(
                                                        command =>
                                                            `
                                                                <div class="editor-command">

                                                                    <div>

                                                                        <code>
                                                                            ${escapeHtml(
                                                                                command.command
                                                                            )}
                                                                        </code>

                                                                        <p>
                                                                            ${formatText(
                                                                                command.description
                                                                            )}
                                                                        </p>

                                                                        <small style="color:var(--muted)">
                                                                            ${escapeHtml(
                                                                                formatCommandAudience(
                                                                                    command.audience
                                                                                )
                                                                            )}
                                                                        </small>

                                                                    </div>

                                                                    <div class="editor-actions">

                                                                        <button
                                                                            class="btn"
                                                                            onclick="editCommand(
                                                                                '${category.id}',
                                                                                '${command.id}'
                                                                            )">
                                                                            EDIT
                                                                        </button>

                                                                        <button
                                                                            class="btn btn-danger"
                                                                            onclick="deleteCommand(
                                                                                '${category.id}',
                                                                                '${command.id}'
                                                                            )">
                                                                            DELETE
                                                                        </button>

                                                                    </div>

                                                                </div>
                                                            `
                                                    )
                                                    .join("")
                                                : `
                                                    <div class="empty-state">
                                                        No commands in this category.
                                                    </div>
                                                `
                                        }

                                    </div>

                                    <div style="margin-top:15px">

                                        <button
                                            class="btn"
                                            onclick="addCommand(
                                                '${category.id}'
                                            )">
                                            ADD COMMAND
                                        </button>

                                    </div>

                                </section>
                            `
                    )
                    .join("")
                : `
                    <div class="empty-state">
                        No categories have been created.
                    </div>
                `
        }
    `;
}

async function addCommandCategory() {
    const title =
        prompt(
            "Category title:"
        );

    if (!title?.trim()) {
        return;
    }

    const description =
        prompt(
            "Category description:"
        ) || "";

    try {
        await api(
            "/api/staffhub/commands/categories",
            {
                method: "POST",

                body:
                    JSON.stringify({
                        title:
                            title.trim(),

                        description
                    })
            }
        );

        await loadCommands();

        renderCommandEditor();

        renderCommands();
    } catch (error) {
        alert(error.message);
    }
}

async function editCommandCategory(
    categoryId
) {
    const category =
        commandCategories.find(
            item =>
                item.id ===
                categoryId
        );

    if (!category) {
        return;
    }

    const title =
        prompt(
            "Category title:",
            category.title ||
            category.name
        );

    if (!title?.trim()) {
        return;
    }

    const description =
        prompt(
            "Category description:",
            category.description ||
            ""
        );

    if (description === null) {
        return;
    }

    try {
        await api(
            `/api/staffhub/commands/categories/${categoryId}`,
            {
                method: "PUT",

                body:
                    JSON.stringify({
                        title:
                            title.trim(),

                        description
                    })
            }
        );

        await loadCommands();

        renderCommandEditor();

        renderCommands();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteCommandCategory(
    categoryId
) {
    const category =
        commandCategories.find(
            item =>
                item.id ===
                categoryId
        );

    if (!category) {
        return;
    }

    if (
        !confirm(
            `Delete "${category.title || category.name}" and all commands inside it?`
        )
    ) {
        return;
    }

    try {
        await api(
            `/api/staffhub/commands/categories/${categoryId}`,
            {
                method: "DELETE"
            }
        );

        await loadCommands();

        renderCommandEditor();

        renderCommands();
    } catch (error) {
        alert(error.message);
    }
}

async function addCommand(
    categoryId
) {
    const command =
        prompt(
            "Command:"
        );

    if (!command?.trim()) {
        return;
    }

    const description =
        prompt(
            "What does this command do?"
        );

    if (
        description === null ||
        !description.trim()
    ) {
        return;
    }

    const audience =
        await promptCommandAudience();

    if (!audience) {
        return;
    }

    try {
        await api(
            `/api/staffhub/commands/categories/${categoryId}/commands`,
            {
                method: "POST",

                body:
                    JSON.stringify({
                        command:
                            command.trim(),

                        description:
                            description.trim(),

                        audience
                    })
            }
        );

        await loadCommands();

        renderCommandEditor();

        renderCommands();
    } catch (error) {
        alert(error.message);
    }
}

async function editCommand(
    categoryId,
    commandId
) {
    const category =
        commandCategories.find(
            item =>
                item.id ===
                categoryId
        );

    if (!category) {
        return;
    }

    const commandData =
        category.commands.find(
            item =>
                item.id ===
                commandId
        );

    if (!commandData) {
        return;
    }

    const command =
        prompt(
            "Command:",
            commandData.command
        );

    if (!command?.trim()) {
        return;
    }

    const description =
        prompt(
            "Description:",
            commandData.description
        );

    if (
        description === null ||
        !description.trim()
    ) {
        return;
    }

    const audience =
        await promptCommandAudience(
            commandData.audience
        );

    if (!audience) {
        return;
    }

    try {
        await api(
            `/api/staffhub/commands/categories/${categoryId}/commands/${commandId}`,
            {
                method: "PUT",

                body:
                    JSON.stringify({
                        command:
                            command.trim(),

                        description:
                            description.trim(),

                        audience
                    })
            }
        );

        await loadCommands();

        renderCommandEditor();

        renderCommands();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteCommand(
    categoryId,
    commandId
) {
    if (
        !confirm(
            "Delete this command?"
        )
    ) {
        return;
    }

    try {
        await api(
            `/api/staffhub/commands/categories/${categoryId}/commands/${commandId}`,
            {
                method: "DELETE"
            }
        );

        await loadCommands();

        renderCommandEditor();

        renderCommands();
    } catch (error) {
        alert(error.message);
    }
}

async function promptCommandAudience(
    existing = null
) {
    const current =
        existing?.type ||
        "staff";

    const type =
        prompt(
            "Who can use this command?\n\n" +
            "everyone = everyone\n" +
            "staff = all staff\n" +
            "roles = selected Discord roles\n\n" +
            "Enter one:",
            current
        );

    if (!type) {
        return null;
    }

    const normalized =
        type.trim().toLowerCase();

    if (
        ![
            "everyone",
            "staff",
            "roles"
        ].includes(
            normalized
        )
    ) {
        alert(
            "Use everyone, staff, or roles."
        );

        return null;
    }

    if (
        normalized !==
        "roles"
    ) {
        return {
            type:
                normalized,

            roles:
                []
        };
    }

    if (!commandRoles.length) {
        await loadCommandRoles();
    }

    const selected =
        prompt(
            "Enter Discord role IDs separated by commas:",
            existing?.roles?.join(", ") ||
            ""
        );

    if (!selected?.trim()) {
        return null;
    }

    const roles =
        [
            ...new Set(
                selected
                    .split(",")
                    .map(
                        id =>
                            id.trim()
                    )
                    .filter(Boolean)
            )
        ];

    const invalid =
        roles.filter(
            id =>
                !commandRoles.some(
                    role =>
                        role.id ===
                        id
                )
        );

    if (invalid.length) {
        alert(
            `Unknown role IDs:\n${invalid.join(
                "\n"
            )}`
        );

        return null;
    }

    return {
        type: "roles",
        roles
    };
}

/*
==================================================
PAGE PERMISSIONS
==================================================
*/

async function openPagePermissions(
    pageName
) {
    if (!staffMe.founder) {
        return;
    }

    const editorId =
        pageName === "commands"
            ? "command-permissions"
            : pageName === "promosDemos"
                ? "promos-demos-permissions"
                : `${pageName}-permissions`;

    const containerId =
    pageName === "commands"
        ? "command-permissions-content"
        : pageName === "promosDemos"
            ? "promos-demos-permissions"
            : `${pageName}-permissions-content`;

    const section =
        qs(editorId);

    if (!section) {
        return;
    }

    section.hidden = false;

    const data =
        await api(
            "/api/staffhub/permissions"
        );

    const roles =
        await loadPermissionRoles();

    renderPermissionsEditor(
        containerId,
        pageName,
        data.permissions,
        roles
    );

    section.scrollIntoView({
        behavior: "smooth"
    });
}

function closePagePermissions(
    pageName
) {
    const id =
        pageName === "commands"
            ? "command-permissions"
            : pageName === "promosDemos"
                ? "promos-demos-permissions"
                : `${pageName}-permissions`;

    const section =
        qs(id);

    if (section) {
        section.hidden = true;
    }
}

function openCommandPermissions() {
    return openPagePermissions(
        "commands"
    );
}

function closeCommandPermissions() {
    closePagePermissions(
        "commands"
    );
}





function closeAnnouncementsPermissions() {
    closePagePermissions(
        "announcements"
    );
}

function closePromosDemosPermissions() {
    closePagePermissions(
        "promosDemos"
    );
}

async function loadPermissionRoles() {
    const data =
        await api(
            "/api/staffhub/roles"
        );

    return (
        data.roles || []
    ).filter(
        role =>
            !role.managed
    );
}

function renderPermissionsEditor(
    containerId,
    pageName,
    permissions,
    roles
) {
    const container =
        qs(containerId);

    if (!container) {
        return;
    }

    const page =
        permissions?.[pageName];

    if (!page) {
        container.innerHTML = `
            <div class="empty-state">
                Permission data unavailable.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="permission-page">

            <h3>
                ${escapeHtml(
                    PAGE_INFO[
                        pageName
                    ].title
                )} Access
            </h3>

            <div class="permission-columns">

                <div class="permission-box">

                    <h4>
                        VIEW ACCESS
                    </h4>

                    <label>
                        Enabled
                    </label>

                    <select
                        id="perm-view-enabled-${pageName}">
                        <option
                            value="true"
                            ${
                                page.view?.enabled !== false
                                    ? "selected"
                                    : ""
                            }>
                            Enabled
                        </option>

                        <option
                            value="false"
                            ${
                                page.view?.enabled === false
                                    ? "selected"
                                    : ""
                            }>
                            Disabled
                        </option>
                    </select>

                    <label>
                        Minimum Staff Level
                    </label>

                    <input
                        type="number"
                        id="perm-view-level-${pageName}"
                        value="${escapeHtml(
                            page.view?.minimumLevel ??
                            750
                        )}">

                    <label>
                        Additional Discord Roles
                    </label>

                    <select
                        multiple
                        class="role-select"
                        id="perm-view-roles-${pageName}">

                        ${
                            roles
                                .map(
                                    role =>
                                        `
                                            <option
                                                value="${role.id}"
                                                ${
                                                    page.view?.roles?.includes(
                                                        role.id
                                                    )
                                                        ? "selected"
                                                        : ""
                                                }>
                                                ${escapeHtml(
                                                    role.name
                                                )}
                                            </option>
                                        `
                                )
                                .join("")
                        }

                    </select>

                </div>

                <div class="permission-box">

                    <h4>
                        EDIT ACCESS
                    </h4>

                    <label>
                        Minimum Staff Level
                    </label>

                    <input
                        type="number"
                        id="perm-edit-level-${pageName}"
                        value="${escapeHtml(
                            page.edit?.minimumLevel ??
                            1000
                        )}">

                    <label>
                        Additional Discord Roles
                    </label>

                    <select
                        multiple
                        class="role-select"
                        id="perm-edit-roles-${pageName}">

                        ${
                            roles
                                .map(
                                    role =>
                                        `
                                            <option
                                                value="${role.id}"
                                                ${
                                                    page.edit?.roles?.includes(
                                                        role.id
                                                    )
                                                        ? "selected"
                                                        : ""
                                                }>
                                                ${escapeHtml(
                                                    role.name
                                                )}
                                            </option>
                                        `
                                )
                                .join("")
                        }

                    </select>

                </div>

            </div>

            <div class="form-actions">

                <button
                    class="btn"
                    onclick="savePagePermission(
                        '${pageName}'
                    )">
                    SAVE PERMISSIONS
                </button>

            </div>

        </div>
    `;
}

function selectedValues(
    select
) {
    return [
        ...select.selectedOptions
    ].map(
        option =>
            option.value
    );
}

async function savePagePermission(
    pageName
) {
    try {
        const data =
            await api(
                "/api/staffhub/permissions"
            );

        const permissions =
            data.permissions;

        const viewEnabled =
            qs(
                `perm-view-enabled-${pageName}`
            ).value === "true";

        const viewLevel =
            Number(
                qs(
                    `perm-view-level-${pageName}`
                ).value
            );

        const editLevel =
            Number(
                qs(
                    `perm-edit-level-${pageName}`
                ).value
            );

        const viewRoles =
            selectedValues(
                qs(
                    `perm-view-roles-${pageName}`
                )
            );

        const editRoles =
            selectedValues(
                qs(
                    `perm-edit-roles-${pageName}`
                )
            );

        permissions[
            pageName
        ].view = {
            enabled:
                viewEnabled,

            minimumLevel:
                Number.isFinite(
                    viewLevel
                )
                    ? viewLevel
                    : 750,

            roles:
                viewRoles
        };

        permissions[
            pageName
        ].edit = {
            minimumLevel:
                Number.isFinite(
                    editLevel
                )
                    ? editLevel
                    : 1000,

            roles:
                editRoles
        };

        await api(
            "/api/staffhub/permissions",
            {
                method: "PUT",

                body:
                    JSON.stringify({
                        permissions
                    })
            }
        );

        alert(
            "Permissions saved."
        );

        window.location.reload();
    } catch (error) {
        alert(error.message);
    }
}

/* ==================================================
   STAFF ACTIVITY
================================================== */

let staffActivityData = [];

let staffActivityFilters = {
    type: "all",
    member: "all",
    executor: "all"
};

async function renderStaffUpdates() {
    const container = qs("staff-updates-list");

    if (!container) {
        return;
    }

    try {
        const data = await api(
            "/api/staffhub/staff-updates"
        );

        staffActivityData =
            Array.isArray(data.updates)
                ? data.updates
                : [];

        renderActivityUI(container);

    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}

function getActivityLabel(type) {
    switch (
        String(type || "").toLowerCase()
    ) {
        case "promotion":
            return "PROMOTION";

        case "demotion":
            return "DEMOTION";

        case "hire":
            return "HIRE";

        case "removal":
            return "FIRE / REMOVAL";

        case "resignation":
            return "RESIGNATION";

        case "demo":
        case "demos":
        case "demonstration":
            return "DEMO";

        default:
            return String(
                type || "ACTIVITY"
            )
                .replaceAll("_", " ")
                .toUpperCase();
    }
}

function renderActivityUI(container) {
    const types = [
        ["all", "All"],
        ["promotion", "Promotions"],
        ["demotion", "Demotions"],
        ["hire", "Hires"],
        ["removal", "Fires / Removals"],
        ["resignation", "Resignations"],
        ["demo", "Demos"]
    ];

    const members = [
        ...new Map(
            staffActivityData
                .filter(update => update.memberId)
                .map(update => [
                    update.memberId,
                    update.displayName ||
                    update.username ||
                    update.memberId
                ])
        )
    ].sort((a, b) =>
        a[1].localeCompare(b[1])
    );

    const executors = [
        ...new Map(
            staffActivityData
                .filter(update => update.updatedBy?.id)
                .map(update => [
                    update.updatedBy.id,
                    update.updatedBy.displayName ||
                    update.updatedBy.username ||
                    update.updatedBy.id
                ])
        )
    ].sort((a, b) =>
        a[1].localeCompare(b[1])
    );

    container.innerHTML = `
        <div class="staff-activity-filters">

            <div class="activity-filter">
                <label>ACTIVITY TYPE</label>

                <select id="activity-type-filter">
                    ${types.map(
                        ([value, label]) => `
                            <option
                                value="${value}"
                                ${staffActivityFilters.type === value
                                    ? "selected"
                                    : ""}
                            >
                                ${label}
                            </option>
                        `
                    ).join("")}
                </select>
            </div>

            <div class="activity-filter">
                <label>STAFF MEMBER</label>

                <select id="activity-member-filter">
                    <option value="all">
                        Everyone
                    </option>

                    ${members.map(
                        ([id, name]) => `
                            <option
                                value="${escapeHtml(id)}"
                                ${staffActivityFilters.member === id
                                    ? "selected"
                                    : ""}
                            >
                                ${escapeHtml(name)}
                            </option>
                        `
                    ).join("")}
                </select>
            </div>

            <div class="activity-filter">
                <label>PERFORMED BY</label>

                <select id="activity-executor-filter">
                    <option value="all">
                        Anyone
                    </option>

                    ${executors.map(
                        ([id, name]) => `
                            <option
                                value="${escapeHtml(id)}"
                                ${staffActivityFilters.executor === id
                                    ? "selected"
                                    : ""}
                            >
                                ${escapeHtml(name)}
                            </option>
                        `
                    ).join("")}
                </select>
            </div>

            <button
                type="button"
                class="btn btn-secondary"
                id="activity-clear-filters">
                CLEAR FILTERS
            </button>

        </div>

        <div
            id="staff-activity-results"
            class="staff-activity-results">
        </div>
    `;

    qs("activity-type-filter").onchange = event => {
        staffActivityFilters.type =
            event.target.value;

        renderActivityResults();
    };

    qs("activity-member-filter").onchange = event => {
        staffActivityFilters.member =
            event.target.value;

        renderActivityResults();
    };

    qs("activity-executor-filter").onchange = event => {
        staffActivityFilters.executor =
            event.target.value;

        renderActivityResults();
    };

    qs("activity-clear-filters").onclick = () => {
        staffActivityFilters = {
            type: "all",
            member: "all",
            executor: "all"
        };

        renderActivityUI(container);
    };

    renderActivityResults();
}

function renderActivityResults() {
    const list =
        qs("staff-activity-results");

    if (!list) {
        return;
    }

    const filtered =
        staffActivityData.filter(update => {

            if (
                staffActivityFilters.type !== "all" &&
                String(update.type || "").toLowerCase() !==
                    staffActivityFilters.type
            ) {
                return false;
            }

            if (
                staffActivityFilters.member !== "all" &&
                update.memberId !==
                    staffActivityFilters.member
            ) {
                return false;
            }

            if (
                staffActivityFilters.executor !== "all" &&
                update.updatedBy?.id !==
                    staffActivityFilters.executor
            ) {
                return false;
            }

            return true;
        });

    if (!filtered.length) {
        list.innerHTML = `
            <div class="empty-state">
                No activity matches those filters.
            </div>
        `;

        return;
    }

    list.innerHTML =
        filtered
            .map(update => {

                const oldRoles =
                    Array.isArray(update.oldRoles)
                        ? update.oldRoles
                        : [];

                const newRoles =
                    Array.isArray(update.newRoles)
                        ? update.newRoles
                        : [];

                const oldText =
                    oldRoles.length
                        ? oldRoles
                            .map(role => role.name)
                            .join(", ")
                        : "None";

                const newText =
                    newRoles.length
                        ? newRoles
                            .map(role => role.name)
                            .join(", ")
                        : "None";

                const executor =
                    update.updatedBy
                        ? (
                            update.updatedBy.displayName ||
                            update.updatedBy.username ||
                            "Unknown"
                        )
                        : "Unknown";

                return `
                    <article
                        class="staff-update-card">

                        <div class="staff-update-header">

                            <strong>
                                ${escapeHtml(
                                    update.displayName ||
                                    update.username ||
                                    "Unknown"
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    getActivityLabel(
                                        update.type
                                    )
                                )}
                            </span>

                        </div>

                        <div class="staff-update-roles">

                            <div>
                                <small>FROM</small>

                                <strong>
                                    ${escapeHtml(
                                        oldText
                                    )}
                                </strong>
                            </div>

                            <div>
                                <small>TO</small>

                                <strong>
                                    ${escapeHtml(
                                        newText
                                    )}
                                </strong>
                            </div>

                        </div>

                        <div class="staff-update-meta">

                            <span>
                                Performed by:
                                ${escapeHtml(
                                    executor
                                )}
                            </span>

                            <span>
                                ${escapeHtml(
                                    formatDate(
                                        update.date
                                    )
                                )}
                            </span>

                        </div>

                    </article>
                `;
            })
            .join("");
}
/*
==================================================
CURRENT STAFF
==================================================
*/

/*
    Use the exact Xotic staff hierarchy from
    the public staff.html page.

    Lower order = higher position.
*/

const STAFF_ROLES = {
    "1539785169102442677": {
        name: "FOUNDER",
        order: 1
    },

    "1539785171983933521": {
        name: "CHIEF OF OPERATIONS",
        order: 2
    },

    "1539785176471576707": {
        name: "BOARD OF DIRECTORS",
        order: 3
    },

    "1539785177436258334": {
        name: "BOARD MEMBER",
        order: 4
    },

    "1539785181999927396": {
        name: "CHIEF TECHNOLOGY OFFICER",
        order: 5
    },

    "1539785183052570746": {
        name: "CHIEF OF STAFF",
        order: 6
    },

    "1539785184201941054": {
        name: "CHIEF FINANCIAL OFFICER",
        order: 7
    },

    "1539785188836384860": {
        name: "CHIEF CONTENT OFFICER",
        order: 8
    },

    "1539785187997786142": {
        name: "CHIEF COMMUNITY OFFICER",
        order: 9
    },

    "1539785186496090133": {
        name: "CHIEF MARKETING OFFICER",
        order: 10
    },

    "1539785192355397662": {
        name: "DIRECTOR",
        order: 11
    },

    "1539785195870363741": {
        name: "OPERATIONS",
        order: 12
    },

    "1539785200869838910": {
        name: "HIGH AUTH ASSISTANT",
        order: 13
    },

    "1539785203302662154": {
        name: "EXECUTIVE",
        order: 14
    },

    "1539785209405243543": {
        name: "UPPER MANAGEMENT",
        order: 15
    },

    "1539785210487640115": {
        name: "MANAGEMENT",
        order: 16
    },

    "1539785212588720269": {
        name: "TRIAL MANAGEMENT",
        order: 17
    },

    "1539785215914934343": {
        name: "SENIOR ADMIN",
        order: 18
    },

    "1539785218662080593": {
        name: "ADMIN",
        order: 19
    },

    "1539785220255916083": {
        name: "TRIAL ADMIN",
        order: 20
    },

    "1539785223376470148": {
        name: "SENIOR STAFF",
        order: 21
    },

    "1539785224412725339": {
        name: "STAFF",
        order: 22
    },

    "1539785226211827763": {
        name: "JUNIOR STAFF",
        order: 23
    },

    "1539785227897933867": {
        name: "TRIAL STAFF",
        order: 24
    }
};


/*
    Category grouping.

    Multiple Chief roles all belong
    to the same CHIEFS category.
*/

function getStaffCategory(role) {

    if (!role) {
        return "STAFF";
    }

    const name =
        role.name.toUpperCase();

    if (name.startsWith("CHIEF")) {
        return "CHIEFS";
    }

    return name;
}


/*
    Escape HTML.
*/

function escapeHTML(value) {

    const element =
        document.createElement("div");

    element.textContent =
        value == null ? "" : String(value);

    return element.innerHTML;
}


/*
    Get only actual Xotic staff roles.

    The API returns Discord roles as objects:
    {
        id,
        name,
        color
    }
*/

function getStaffRoles(roles) {

    if (!Array.isArray(roles)) {
        return [];
    }

    return roles
        .filter(role =>
            role &&
            STAFF_ROLES[role.id]
        )
        .map(role => ({
            id: role.id,
            name:
                STAFF_ROLES[role.id].name ||
                role.name,
            order:
                STAFF_ROLES[role.id].order,
            category:
                getStaffCategory(
                    STAFF_ROLES[role.id]
                )
        }))
        .sort(
            (a, b) =>
                a.order - b.order
        );
}


/*
    Find the highest staff role.
*/

function getHighestStaffRole(member) {

    const roles =
        getStaffRoles(member.roles);

    return roles.length
        ? roles[0]
        : null;
}


/*
    Render one staff card.

    This intentionally uses the same classes
    as the public staff.html page.
*/

function createStaffCard(member, index) {

    const roles =
        getStaffRoles(member.roles);

    const roleHTML =
        roles.length
            ? roles
                .map(role => `
                    <div class="player-position">
                        ${escapeHTML(role.name)}
                    </div>
                `)
                .join("")
            : `
                <div class="player-position">
                    STAFF
                </div>
            `;

    const displayName =
        member.displayName ||
        member.globalName ||
        member.username ||
        "Unknown";

    const avatar =
        member.avatar ||
        "";

    return `
        <div
            class="player-card roster-player-enter"
            style="animation-delay: ${index * 0.08}s;"
        >

            <img
                class="player-avatar"
                src="${escapeHTML(avatar)}"
                alt="${escapeHTML(displayName)}"
                loading="lazy"
                decoding="async"
            >

            <div class="player-info">

                <div class="player-name">
                    ${escapeHTML(displayName)}
                </div>

                <div class="staff-role-list">
                    ${roleHTML}
                </div>

            </div>

        </div>
    `;
}


/*
    Render Current Staff.
*/

function renderCurrentStaff() {

    const container = qs("staff");
    const loading = qs("staff-loading");
    const errorBox = qs("staff-error");
    const memberCount = qs("member-count");
    const roleCount = qs("role-count");
    const lastUpdated = qs("staff-last-updated");

    if (!container) {
        return;
    }

    /*
    ==================================================
    XOTIC STAFF HIERARCHY

    Lower order = higher position.

    This is copied from the public staff page so
    StaffHub and the public staff page use the
    exact same hierarchy.
    ==================================================
    */

    const STAFF_ROLES = {

        "1539785169102442677": {
            name: "FOUNDER",
            order: 1,
            category: "FOUNDER"
        },

        "1539785171983933521": {
            name: "CHIEF OF OPERATIONS",
            order: 2,
            category: "CHIEFS"
        },

        "1539785176471576707": {
            name: "BOARD OF DIRECTORS",
            order: 3,
            category: "BOARD OF DIRECTORS"
        },

        "1539785177436258334": {
            name: "BOARD MEMBER",
            order: 4,
            category: "BOARD MEMBER"
        },

        "1539785181999927396": {
            name: "CHIEF TECHNOLOGY OFFICER",
            order: 5,
            category: "CHIEFS"
        },

        "1539785183052570746": {
            name: "CHIEF OF STAFF",
            order: 6,
            category: "CHIEFS"
        },

        "1539785184201941054": {
            name: "CHIEF FINANCIAL OFFICER",
            order: 7,
            category: "CHIEFS"
        },

        "1539785188836384860": {
            name: "CHIEF CONTENT OFFICER",
            order: 8,
            category: "CHIEFS"
        },

        "1539785187997786142": {
            name: "CHIEF COMMUNITY OFFICER",
            order: 9,
            category: "CHIEFS"
        },

        "1539785186496090133": {
            name: "CHIEF MARKETING OFFICER",
            order: 10,
            category: "CHIEFS"
        },

        "1539785192355397662": {
            name: "DIRECTOR",
            order: 11,
            category: "DIRECTOR"
        },

        "1539785195870363741": {
            name: "OPERATIONS",
            order: 12,
            category: "OPERATIONS"
        },

        "1539785200869838910": {
            name: "HIGH AUTH ASSISTANT",
            order: 13,
            category: "HIGH AUTH ASSISTANT"
        },

        "1539785203302662154": {
            name: "EXECUTIVE",
            order: 14,
            category: "EXECUTIVE"
        },

        "1539785209405243543": {
            name: "UPPER MANAGEMENT",
            order: 15,
            category: "UPPER MANAGEMENT"
        },

        "1539785210487640115": {
            name: "MANAGEMENT",
            order: 16,
            category: "MANAGEMENT"
        },

        "1539785212588720269": {
            name: "TRIAL MANAGEMENT",
            order: 17,
            category: "TRIAL MANAGEMENT"
        },

        "1539785215914934343": {
            name: "SENIOR ADMIN",
            order: 18,
            category: "SENIOR ADMIN"
        },

        "1539785218662080593": {
            name: "ADMIN",
            order: 19,
            category: "ADMIN"
        },

        "1539785220255916083": {
            name: "TRIAL ADMIN",
            order: 20,
            category: "TRIAL ADMIN"
        },

        "1539785223376470148": {
            name: "SENIOR STAFF",
            order: 21,
            category: "SENIOR STAFF"
        },

        "1539785224412725339": {
            name: "STAFF",
            order: 22,
            category: "STAFF"
        },

        "1539785226211827763": {
            name: "JUNIOR STAFF",
            order: 23,
            category: "JUNIOR STAFF"
        },

        "1539785227897933867": {
            name: "TRIAL STAFF",
            order: 24,
            category: "TRIAL STAFF"
        }

    };


    /*
    ==================================================
    HELPERS
    ==================================================
    */

    const safe = value =>
        escapeHtml(
            value ?? ""
        );


    function getRecognizedRoles(member) {

        if (
            !member ||
            !Array.isArray(member.roles)
        ) {
            return [];
        }

        return member.roles

            .filter(
                role =>
                    role &&
                    STAFF_ROLES[role.id]
            )

            .map(
                role => {

                    const config =
                        STAFF_ROLES[role.id];

                    return {
                        id: role.id,
                        name:
                            role.name ||
                            config.name,
                        color:
                            role.color ||
                            null,
                        order:
                            config.order,
                        category:
                            config.category
                    };

                }
            )

            .sort(
                (a, b) =>
                    a.order - b.order
            );

    }


    function getHighestRole(member) {

        const roles =
            getRecognizedRoles(member);

        return roles.length
            ? roles[0]
            : null;

    }


    /*
    ==================================================
    LOAD STAFF
    ==================================================
    */

    async function load() {

        try {

            loading?.removeAttribute(
                "hidden"
            );

            if (errorBox) {
                errorBox.hidden = true;
                errorBox.innerHTML = "";
            }

            container.innerHTML = "";


            const data =
                await api(
                    `/api/server/1490116751927546089/staff`
                );


            const members =
                Array.isArray(data?.members)
                    ? data.members
                    : [];


            /*
            ==================================================
            CLEAN MEMBER LIST

            Only keep members who have at least one
            recognized Xotic staff role.
            ==================================================
            */

            const staffMembers =
                members

                    .map(
                        member => ({
                            member,
                            roles:
                                getRecognizedRoles(member)
                        })
                    )

                    .filter(
                        entry =>
                            entry.roles.length > 0
                    );


            /*
            ==================================================
            REMOVE DUPLICATES

            A person must only appear once.
            ==================================================
            */

            const uniqueMembers =
                new Map();


            staffMembers.forEach(
                entry => {

                    const id =
                        entry.member.id ||
                        entry.member.userId ||
                        entry.member.username ||
                        entry.member.displayName;

                    if (
                        !uniqueMembers.has(id)
                    ) {
                        uniqueMembers.set(
                            id,
                            entry
                        );
                    }

                }
            );


            const cleanedMembers =
                [...uniqueMembers.values()];


            /*
            ==================================================
            SORT MEMBERS

            Highest-ranking role first.

            People with the same highest role are
            alphabetically sorted.
            ==================================================
            */

            cleanedMembers.sort(
                (a, b) => {

                    const roleA =
                        a.roles[0];

                    const roleB =
                        b.roles[0];


                    if (
                        roleA.order !==
                        roleB.order
                    ) {
                        return (
                            roleA.order -
                            roleB.order
                        );
                    }


                    return (
                        String(
                            a.member.displayName ||
                            a.member.username ||
                            ""
                        ).localeCompare(
                            String(
                                b.member.displayName ||
                                b.member.username ||
                                ""
                            )
                        )
                    );

                }
            );


            /*
            ==================================================
            STATS
            ==================================================
            */

            if (memberCount) {

                memberCount.textContent =
                    cleanedMembers.length;

            }


            const uniqueRoleIds =
                new Set();

            cleanedMembers.forEach(
                entry => {

                    entry.roles.forEach(
                        role => {

                            uniqueRoleIds.add(
                                role.id
                            );

                        }
                    );

                }
            );


            if (roleCount) {

                roleCount.textContent =
                    uniqueRoleIds.size;

            }


            /*
            ==================================================
            NO STAFF
            ==================================================
            */

            if (!cleanedMembers.length) {

                container.innerHTML = `
                    <div class="staff-empty-state">

                        <strong>
                            No staff members found
                        </strong>

                        <span>
                            The StaffHub API returned no recognized staff roles.
                        </span>

                    </div>
                `;

                return;

            }


            /*
            ==================================================
            GROUP STAFF

            A member belongs to the category determined
            by their highest-ranking role.

            Example:

            Chief of Operations
            Chief of Staff
            Operations Manager
            Senior Staff

            Highest role = Chief of Operations

            Category = CHIEFS

            The member appears ONCE, while every
            recognized role is displayed.
            ==================================================
            */

            const groups =
                new Map();


            cleanedMembers.forEach(
                entry => {

                    const highestRole =
                        getHighestRole(
                            entry.member
                        );

                    if (!highestRole) {
                        return;
                    }


                    const category =
                        highestRole.category;


                    if (!groups.has(category)) {

                        groups.set(
                            category,
                            {
                                name:
                                    category,
                                order:
                                    highestRole.order,
                                members: []
                            }
                        );

                    }


                    groups
                        .get(category)
                        .members
                        .push(entry);

                }
            );


            /*
            ==================================================
            SORT GROUPS
            ==================================================
            */

            const sortedGroups =
                [...groups.values()]
                    .sort(
                        (a, b) =>
                            a.order -
                            b.order
                    );


            /*
            ==================================================
            RENDER
            ==================================================
            */

            container.innerHTML =
                sortedGroups
                    .map(
                        group => {

                            const memberCards =
                                group.members
                                    .map(
                                        entry => {

                                            const member =
                                                entry.member;

                                            const roles =
                                                entry.roles;


                                            const avatar =
                                                member.avatar ||
                                                "assets/whitelogo.png";


                                            const displayName =
                                                member.displayName ||
                                                member.username ||
                                                "Unknown User";


                                            /*
                                            All recognized staff
                                            roles are displayed.

                                            Highest role is NOT
                                            duplicated separately.
                                            */

                                            const roleHTML =
                                                roles
                                                    .map(
                                                        role => {

                                                            const roleColor =
                                                                role.color &&
                                                                role.color !== "#000000"
                                                                    ? role.color
                                                                    : null;


                                                            return `
                                                                <div
                                                                    class="player-position"
                                                                    ${
                                                                        roleColor
                                                                            ? `style="--role-color:${safe(roleColor)};"`
                                                                            : ""
                                                                    }
                                                                >
                                                                    ${safe(role.name)}
                                                                </div>
                                                            `;

                                                        }
                                                    )
                                                    .join("");


                                            return `
                                                <article
                                                    class="staff-member"
                                                >

                                                    <img
                                                        class="staff-member-avatar"
                                                        src="${safe(avatar)}"
                                                        alt="${safe(displayName)}"
                                                        loading="lazy"
                                                        onerror="this.onerror=null;this.src='assets/whitelogo.png';"
                                                    >

                                                    <div class="staff-member-info">

                                                        <div class="staff-member-name">
                                                            ${safe(displayName)}
                                                        </div>

                                                        <div class="staff-member-username">
                                                            ${
                                                                member.username
                                                                    ? `@${safe(member.username)}`
                                                                    : ""
                                                            }
                                                        </div>

                                                        <div class="staff-member-roles">
                                                            ${roleHTML}
                                                        </div>

                                                    </div>

                                                </article>
                                            `;

                                        }
                                    )
                                    .join("");


                            return `
                                <section
                                    class="staff-role-group"
                                    data-category="${safe(group.name)}"
                                >

                                    <header class="staff-role-header">

                                        <div class="staff-role-header-left">

                                            <div class="staff-role-icon">
                                                ${group.name === "CHIEFS" ? "★" : "◆"}
                                            </div>

                                            <div>

                                                <h3 class="staff-role-title">
                                                    ${safe(group.name)}
                                                </h3>

                                                <span class="staff-role-count">
                                                    ${
                                                        group.members.length
                                                    }
                                                    ${
                                                        group.members.length === 1
                                                            ? "MEMBER"
                                                            : "MEMBERS"
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                    </header>


                                    <div class="staff-member-grid">

                                        ${memberCards}

                                    </div>

                                </section>
                            `;

                        }
                    )
                    .join("");


            if (lastUpdated) {

                lastUpdated.textContent =
                    `Updated ${new Date().toLocaleString(
                        [],
                        {
                            dateStyle: "medium",
                            timeStyle: "short"
                        }
                    )}`;

            }


        } catch (error) {

            console.error(
                "Current Staff loading error:",
                error
            );


            if (memberCount) {
                memberCount.textContent = "—";
            }

            if (roleCount) {
                roleCount.textContent = "—";
            }


            if (errorBox) {

                errorBox.hidden = false;

                errorBox.innerHTML = `
                    <strong>
                        Unable to load staff
                    </strong>

                    <span>
                        ${
                            safe(
                                error?.message ||
                                "The staff roster could not be loaded."
                            )
                        }
                    </span>
                `;

            }


            container.innerHTML = "";

        } finally {

            if (loading) {
                loading.setAttribute(
                    "hidden",
                    ""
                );
            }

        }

    }


    load();

}
