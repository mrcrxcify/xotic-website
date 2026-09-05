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
            "Promotional and demonstration resources.",
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
    return escapeHtml(value)
        .replace(/\n/g, "<br>");
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

async function requireStaff() {
    try {
        staffMe =
            await api(
                "/api/staffhub/me"
            );

        if (qs("staff-user")) {
            qs("staff-user").innerHTML = `
                <img
                    src="${escapeHtml(
                        staffMe.user.avatar
                    )}"
                    alt=""
                >
                <span>
                    ${escapeHtml(
                        staffMe.user.displayName
                    )}
                </span>
            `;
        }

        if (qs("staff-server")) {
            qs("staff-server").textContent =
                staffMe.serverName;
        }

        return true;
    } catch (error) {
        if (error.status === 401) {
            window.location.href =
                `${API_URL}/auth/discord?server=${encodeURIComponent(
                    SERVER_SLUG
                )}`;

            return false;
        }

        document.body.innerHTML = `
            <main class="access-error">
                <div class="container">
                    <div class="section-label">
                        STAFFHUB ERROR
                    </div>

                    <h1>
                        UNABLE TO VERIFY ACCESS
                    </h1>

                    <p>
                        ${escapeHtml(
                            error.message
                        )}
                    </p>
                </div>
            </main>
        `;

        return false;
    }
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
            !redirectIfNoAccess(
                page
            )
        ) {
            return;
        }

        if (
            page === "home"
        ) {
            renderHome();
        }

        if (
            page === "commands"
        ) {
            renderCommands();
        }

        if (
            page === "tickets" ||
            page === "etiquette" ||
            page === "promosDemos"
        ) {
            renderDocumentPage(
                page
            );
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
            result.image
        );
    }

    return images;
}

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

                    ${
                        category.images?.length
                            ? `
                                <div class="document-images">
                                    ${
                                        category.images
                                            .map(
                                                image => `
                                                    <img
                                                        src="${escapeHtml(
                                                            image.url
                                                        )}"
                                                        alt="${escapeHtml(
                                                            image.name
                                                        )}">
                                                `
                                            )
                                            .join("")
                                    }
                                </div>
                            `
                            : ""
                    }
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

function documentCategoryEditorHtml(
    pageName,
    category
) {
    return `
        <div
            class="editor-category"
            id="category-${escapeHtml(
                category.id
            )}">

            <div class="editor-category-header">

                <div style="flex:1">

                    <label>
                        Category title
                    </label>

                    <input
                        id="title-${escapeHtml(
                            category.id
                        )}"
                        value="${escapeHtml(
                            category.title ||
                            category.name ||
                            ""
                        )}">

                </div>

                <div class="editor-actions">

                    <button
                        class="btn"
                        onclick="saveDocumentCategory(
                            '${pageName}',
                            '${category.id}'
                        )">
                        SAVE
                    </button>

                    <button
                        class="btn btn-danger"
                        onclick="deleteDocumentCategory(
                            '${pageName}',
                            '${category.id}'
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
                        id="description-${escapeHtml(
                            category.id
                        )}"
                        style="min-height:100px">${escapeHtml(
                            category.description ||
                            ""
                        )}</textarea>
                </div>

                <div class="form-full">
                    <label>
                        Content
                    </label>

                    <textarea
                        id="content-${escapeHtml(
                            category.id
                        )}">${escapeHtml(
                            category.content ||
                            ""
                        )}</textarea>
                </div>

                <div class="form-full">

                    <label>
                        Images
                    </label>

                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onchange="handleDocumentImages(
                            '${pageName}',
                            '${category.id}',
                            this.files
                        )">

                    <div
                        id="images-${escapeHtml(
                            category.id
                        )}"
                        class="image-preview">

                        ${
                            (category.images || [])
                                .map(
                                    image =>
                                        `
                                            <div class="image-item">
                                                <img
                                                    src="${escapeHtml(
                                                        image.url
                                                    )}"
                                                    alt="">

                                                <button
                                                    type="button"
                                                    onclick="removeCategoryImage(
                                                        '${category.id}',
                                                        '${image.id}'
                                                    )">
                                                    ×
                                                </button>
                                            </div>
                                        `
                                )
                                .join("")
                        }

                    </div>

                    <input
                        type="hidden"
                        id="image-data-${escapeHtml(
                            category.id
                        )}"
                        value="${escapeHtml(
                            JSON.stringify(
                                category.images || []
                            )
                        )}">
                </div>

            </div>
        </div>
    `;
}

async function handleDocumentImages(
    pageName,
    categoryId,
    files
) {
    try {
        const images =
            await uploadImages(
                [...files],
                pageName
            );

        const input =
            qs(
                `image-data-${categoryId}`
            );

        const existing =
            JSON.parse(
                input.value || "[]"
            );

        input.value =
            JSON.stringify(
                existing.concat(
                    images
                )
            );

        renderCategoryImages(
            categoryId
        );
    } catch (error) {
        alert(error.message);
    }
}

function renderCategoryImages(
    categoryId
) {
    const input =
        qs(
            `image-data-${categoryId}`
        );

    const container =
        qs(
            `images-${categoryId}`
        );

    if (
        !input ||
        !container
    ) {
        return;
    }

    let images = [];

    try {
        images =
            JSON.parse(
                input.value || "[]"
            );
    } catch {}

    container.innerHTML =
        images.map(
            image => `
                <div class="image-item">
                    <img
                        src="${escapeHtml(
                            image.url
                        )}"
                        alt="">

                    <button
                        type="button"
                        onclick="removeCategoryImage(
                            '${categoryId}',
                            '${image.id}'
                        )">
                        ×
                    </button>
                </div>
            `
        ).join("");
}

function removeCategoryImage(
    categoryId,
    imageId
) {
    const input =
        qs(
            `image-data-${categoryId}`
        );

    if (!input) {
        return;
    }

    let images =
        JSON.parse(
            input.value || "[]"
        );

    images =
        images.filter(
            image =>
                image.id !== imageId
        );

    input.value =
        JSON.stringify(
            images
        );

    renderCategoryImages(
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

            images:
                []
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

        category.images =
            JSON.parse(
                qs(
                    `image-data-${categoryId}`
                ).value || "[]"
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

            ${
                item.images?.length
                    ? `
                        <div class="announcement-images">
                            ${
                                item.images
                                    .map(
                                        image =>
                                            `
                                                <img
                                                    src="${escapeHtml(
                                                        image.url
                                                    )}"
                                                    alt="${escapeHtml(
                                                        image.name
                                                    )}">
                                            `
                                    )
                                    .join("")
                            }
                        </div>
                    `
                    : ""
            }

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
    try {
        const title =
            qs(
                "announcement-title"
            ).value.trim();

        const content =
            qs(
                "announcement-content"
            ).value.trim();

        if (!title || !content) {
            alert(
                "Title and content are required."
            );

            return;
        }

        const files =
            [
                ...(qs(
                    "announcement-files"
                ).files || [])
            ];

        const images =
            await uploadImages(
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
                        images
                    })
            }
        );

        closeAnnouncementsEditor();

        await renderAnnouncements();

        alert(
            "Announcement published."
        );
    } catch (error) {
        alert(error.message);
    }
}

async function editAnnouncement(
    id
) {
    const data =
        await api(
            "/api/staffhub/announcements"
        );

    const item =
        (data.announcements || [])
            .find(
                announcement =>
                    announcement.id ===
                    id
            );

    if (!item) {
        return;
    }

    const title =
        prompt(
            "Announcement title:",
            item.title
        );

    if (!title?.trim()) {
        return;
    }

    const content =
        prompt(
            "Announcement content:",
            item.content
        );

    if (
        content === null ||
        !content.trim()
    ) {
        return;
    }

    await api(
        `/api/staffhub/announcements/${id}`,
        {
            method: "PUT",

            body:
                JSON.stringify({
                    title:
                        title.trim(),

                    content:
                        content.trim(),

                    images:
                        item.images || []
                })
        }
    );

    renderAnnouncements();
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

                                                            <span
                                                                class="command-audience">

                                                                ${escapeHtml(
                                                                    formatCommandAudience(
                                                                        command.audience
                                                                    )
                                                                )}

                                                            </span>
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
                : `${pageName}-permissions`;

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

function closeTicketsPermissions() {
    closePagePermissions(
        "tickets"
    );
}

function closeEtiquettePermissions() {
    closePagePermissions(
        "etiquette"
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

/*
==================================================
STAFF ACTIVITY
==================================================
*/

async function renderStaffUpdates() {
    const list =
        qs(
            "staff-updates-list"
        );

    if (!list) {
        return;
    }

    try {
        const data =
            await api(
                "/api/staffhub/staff-updates"
            );

        const updates =
            data.updates || [];

        if (!updates.length) {
            list.innerHTML = `
                <div class="empty-state">
                    No staff activity has been recorded yet.
                </div>
            `;

            return;
        }

        list.innerHTML =
            updates
                .map(
                    update =>
                        staffUpdateHtml(
                            update
                        )
                )
                .join("");
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

function staffUpdateHtml(
    update
) {
    const type =
        String(
            update.type ||
            "role_change"
        );

    const label =
        {
            hire:
                "HIRED",

            promotion:
                "PROMOTED",

            demotion:
                "DEMOTED",

            removal:
                "REMOVED",

            resignation:
                "LEFT STAFF",

            role_change:
                "STAFF ROLE CHANGE"
        }[type] ||
        "STAFF UPDATE";

    const oldRoles =
        (update.oldRoles || [])
            .map(
                role =>
                    `${role.name} (Level ${role.level})`
            )
            .join(", ") ||
        "No staff role";

    const newRoles =
        (update.newRoles || [])
            .map(
                role =>
                    `${role.name} (Level ${role.level})`
            )
            .join(", ") ||
        "No staff role";

    const executor =
        update.updatedBy;

    return `
        <article
            class="update-card update-${escapeHtml(
                type
            )}">

            <div class="update-top">

                <div>
                    <div class="update-type">
                        ${label}
                    </div>

                    <h2>
                        ${escapeHtml(
                            update.displayName ||
                            update.username ||
                            "Unknown"
                        )}
                    </h2>
                </div>

                <div class="update-meta">
                    ${escapeHtml(
                        formatDate(
                            update.date
                        )
                    )}
                </div>

            </div>

            <div class="role-change">

                <div class="role-box">

                    <strong>
                        Previous
                    </strong>

                    <span>
                        ${escapeHtml(
                            oldRoles
                        )}
                    </span>

                </div>

                <div class="role-box">

                    <strong>
                        New
                    </strong>

                    <span>
                        ${escapeHtml(
                            newRoles
                        )}
                    </span>

                </div>

            </div>

            <div
                class="update-meta"
                style="margin-top:14px">

                Updated by:
                ${
                    executor
                        ? escapeHtml(
                            executor.displayName ||
                            executor.username ||
                            "Unknown"
                        )
                        : "Unknown / Discord audit log unavailable"
                }

            </div>

        </article>
    `;
}

/*
==================================================
CURRENT STAFF
==================================================
*/

async function renderCurrentStaff() {
    const list =
        qs(
            "current-staff-list"
        );

    if (!list) {
        return;
    }

    try {
        const data =
            await api(
                "/api/staffhub/current-staff"
            );

        const staff =
            data.staff || [];

        if (!staff.length) {
            list.innerHTML = `
                <div class="empty-state">
                    No current staff members found.
                </div>
            `;

            return;
        }

        list.innerHTML =
            staff.map(
                member => `
                    <article class="staff-card">

                        <img
                            src="${escapeHtml(
                                member.avatar
                            )}"
                            alt="">

                        <div class="staff-card-info">

                            <div class="staff-card-name">
                                ${escapeHtml(
                                    member.displayName
                                )}
                            </div>

                            <div class="staff-card-role">
                                ${escapeHtml(
                                    member.role?.name ||
                                    "Staff"
                                )}
                            </div>

                            <div class="staff-card-level">
                                LEVEL
                                ${escapeHtml(
                                    member.level
                                )}
                            </div>

                        </div>

                    </article>
                `
            ).join("");
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
/*
==================================================
STAFFHUB ATTACHMENTS
==================================================
*/

async function uploadAttachments(
    files,
    page
) {
    const attachments = [];

    for (
        const file of Array.from(
            files || []
        )
    ) {
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

                            type:
                                file.type,

                            data
                        })
                }
            );

        if (
            result.attachment
        ) {
            attachments.push(
                result.attachment
            );
        }
    }

    return attachments;
}

function getAttachments(
    item
) {
    if (
        Array.isArray(
            item?.attachments
        )
    ) {
        return item.attachments;
    }

    if (
        Array.isArray(
            item?.images
        )
    ) {
        return item.images.map(
            image => ({
                ...image,

                type:
                    "image/*"
            })
        );
    }

    return [];
}

function renderAttachments(
    attachments
) {
    if (
        !attachments?.length
    ) {
        return "";
    }

    return `
        <div class="staffhub-attachments">

            ${attachments.map(
                file => {
                    const name =
                        escapeHtml(
                            file.name ||
                            "Attachment"
                        );

                    const url =
                        escapeHtml(
                            file.url ||
                            ""
                        );

                    const type =
                        escapeHtml(
                            file.type ||
                            ""
                        );

                    if (
                        (
                            file.type ||
                            ""
                        ).startsWith(
                            "image/"
                        )
                    ) {
                        return `
                            <a
                                class="staffhub-attachment-image"
                                href="${url}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    src="${url}"
                                    alt="${name}"
                                    loading="lazy"
                                >
                            </a>
                        `;
                    }

                    const size =
                        file.size
                            ? `${Math.max(
                                1,
                                Math.round(
                                    file.size /
                                    1024
                                )
                            )} KB`
                            : "";

                    return `
                        <a
                            class="staffhub-attachment-file"
                            href="${url}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span
                                class="staffhub-attachment-icon"
                            >
                                FILE
                            </span>

                            <span
                                class="staffhub-attachment-info"
                            >
                                <strong>
                                    ${name}
                                </strong>

                                <small>
                                    ${type}
                                    ${
                                        size
                                            ? ` • ${size}`
                                            : ""
                                    }
                                </small>
                            </span>

                            <span>
                                ↗
                            </span>
                        </a>
                    `;
                }
            ).join("")}

        </div>
    `;
}
function activityGroup(
    type
) {
    switch (
        String(
            type || ""
        ).toLowerCase()
    ) {
        case "promotion":
        case "demotion":
            return "promotions";

        case "hire":
            return "hires";

        case "removal":
        case "resignation":
            return "fires";

        case "demo":
        case "demos":
        case "demonstration":
            return "demos";

        default:
            return "all";
    }
}

function activityLabel(
    type
) {
    switch (
        String(
            type || ""
        ).toLowerCase()
    ) {
        case "promotion":
            return "PROMOTION";

        case "demotion":
            return "DEMOTION";

        case "hire":
            return "HIRE";

        case "removal":
            return "FIRED / REMOVED";

        case "resignation":
            return "RESIGNATION";

        case "demo":
        case "demos":
        case "demonstration":
            return "DEMO";

        default:
            return String(
                type ||
                "ROLE CHANGE"
            )
                .replaceAll(
                    "_",
                    " "
                )
                .toUpperCase();
    }
}
async function renderActivityLog() {
    const list =
        qs(
            "staff-updates-list"
        );

    if (!list) {
        return;
    }

    try {
        const data =
            await api(
                "/api/staffhub/staff-updates"
            );

        const updates =
            Array.isArray(
                data.updates
            )
                ? data.updates
                : [];

        const typeFilter =
            qs(
                "activity-type-filter"
            );

        const userFilter =
            qs(
                "activity-user-filter"
            );

        if (
            userFilter
        ) {
            const users =
                [
                    ...new Map(
                        updates
                            .filter(
                                update =>
                                    update.memberId
                            )
                            .map(
                                update => [
                                    update.memberId,

                                    update.displayName ||
                                    update.username ||
                                    update.memberId
                                ]
                            )
                    )
                ]
                    .sort(
                        (a, b) =>
                            a[1].localeCompare(
                                b[1]
                            )
                    );

            userFilter.innerHTML = `
                <option value="all">
                    All Staff
                </option>

                ${users.map(
                    ([id, name]) => `
                        <option
                            value="${escapeHtml(id)}"
                        >
                            ${escapeHtml(name)}
                        </option>
                    `
                ).join("")}
            `;
        }

        function draw() {
            const selectedType =
                typeFilter?.value ||
                "all";

            const selectedUser =
                userFilter?.value ||
                "all";

            const filtered =
                updates.filter(
                    update => {
                        const typeOkay =
                            selectedType ===
                                "all" ||
                            activityGroup(
                                update.type
                            ) ===
                                selectedType;

                        const userOkay =
                            selectedUser ===
                                "all" ||
                            update.memberId ===
                                selectedUser;

                        return (
                            typeOkay &&
                            userOkay
                        );
                    }
                );

            if (
                !filtered.length
            ) {
                list.innerHTML = `
                    <div class="empty-state">
                        No matching staff activity.
                    </div>
                `;

                return;
            }

            list.innerHTML =
                filtered.map(
                    update => `
                        <article
                            class="staff-update-card"
                        >
                            <div
                                class="staff-update-top"
                            >
                                <span
                                    class="staff-update-type"
                                >
                                    ${escapeHtml(
                                        activityLabel(
                                            update.type
                                        )
                                    )}
                                </span>

                                <time>
                                    ${escapeHtml(
                                        formatDate(
                                            update.date
                                        )
                                    )}
                                </time>
                            </div>

                            <h3>
                                ${escapeHtml(
                                    update.displayName ||
                                    update.username ||
                                    "Unknown"
                                )}
                            </h3>

                            <p>
                                ${
                                    update.oldRoles?.length
                                        ? escapeHtml(
                                            update.oldRoles
                                                .map(
                                                    role =>
                                                        role.name
                                                )
                                                .join(
                                                    ", "
                                                )
                                        ) +
                                        " → "
                                        : ""
                                }

                                ${
                                    update.newRoles?.length
                                        ? escapeHtml(
                                            update.newRoles
                                                .map(
                                                    role =>
                                                        role.name
                                                )
                                                .join(
                                                    ", "
                                                )
                                        )
                                        : ""
                                }
                            </p>

                            ${
                                update.updatedBy
                                    ? `
                                        <small>
                                            Updated by
                                            ${escapeHtml(
                                                update.updatedBy.displayName ||
                                                update.updatedBy.username ||
                                                "Unknown"
                                            )}
                                        </small>
                                    `
                                    : ""
                            }
                        </article>
                    `
                ).join("");
        }

        typeFilter?.addEventListener(
            "change",
            draw
        );

        userFilter?.addEventListener(
            "change",
            draw
        );

        draw();

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
document.addEventListener(
    "DOMContentLoaded",
    () => {
        const page =
            document.body.dataset.page;

        if (
            page ===
            "promosDemos"
        ) {
            const edit =
                qs(
                    "promos-demos-edit-button"
                );

            const permissions =
                qs(
                    "promos-demos-permissions-button"
                );

            if (edit) {
                edit.remove();
            }

            if (permissions) {
                permissions.remove();
            }

            setTimeout(
                () => {
                    renderActivityLog();
                },
                100
            );
        }
    }
);