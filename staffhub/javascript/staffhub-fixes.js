js
/*
==================================================
XOTIC STAFFHUB
FINAL FRONTEND FIXES
==================================================

This file loads AFTER staffhub.js.

Fixes:
- Proper editor mode
- Editors replace the normal page
- Tickets attachment removal
- Etiquette attachment removal
- Immediate removal of newly uploaded files
- Announcement attachment removal
- Announcement delete refresh
- Commands editor loading
- Permissions editor
- Promos & Demos gear button
- Promos & Demos editor
- Promos & Demos compact activity cards
- Consistent page width
- Proper close behaviour
- Mobile layout
*/

(function () {
    "use strict";

    const $ = id => document.getElementById(id);

    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function main() {
        return (
            document.querySelector(".hub-main") ||
            document.querySelector(".staff-page")
        );
    }

    function hasEdit(page) {
        return (
            typeof window.pagePermission === "function" &&
            window.pagePermission(page, "edit")
        );
    }

    function isFounder() {
        return Boolean(window.staffMe?.founder);
    }

    /*
    ==================================================
    EDITOR MODE
    ==================================================
    */

    function enterEditor(editor) {
        if (!editor) return;

        const root = main();

        document.body.classList.add(
            "staffhub-editor-mode"
        );

        if (root) {
            root.querySelectorAll(
                ".page-head, " +
                ".announcement-list, " +
                ".document, " +
                ".content-shell, " +
                ".updates-list, " +
                ".command-list, " +
                ".hub-grid, " +
                ".staff-user-bar"
            ).forEach(element => {
                if (
                    element !== editor &&
                    !editor.contains(element)
                ) {
                    element.classList.add(
                        "staffhub-editor-hidden"
                    );
                }
            });

            root.querySelectorAll(
                ".editor"
            ).forEach(section => {
                if (section !== editor) {
                    section.hidden = true;
                    section.classList.remove(
                        "staffhub-active-editor"
                    );
                }
            });
        }

        editor.hidden = false;

        editor.classList.add(
            "staffhub-active-editor"
        );

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant"
        });
    }

    function exitEditor() {
        document.body.classList.remove(
            "staffhub-editor-mode"
        );

        document
            .querySelectorAll(
                ".staffhub-editor-hidden"
            )
            .forEach(element => {
                element.classList.remove(
                    "staffhub-editor-hidden"
                );
            });

        document
            .querySelectorAll(
                ".editor.staffhub-active-editor"
            )
            .forEach(editor => {
                editor.classList.remove(
                    "staffhub-active-editor"
                );

                editor.hidden = true;
            });

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant"
        });
    }

    window.staffhubEnterEditorMode = enterEditor;
    window.staffhubExitEditorMode = exitEditor;

    /*
    ==================================================
    CREATE MISSING PROMOS CONTAINERS
    ==================================================
    */

    function ensurePromosEditor() {
        let editor = $(
            "promos-demos-editor"
        );

        if (editor) {
            return editor;
        }

        const root = main();

        if (!root) {
            return null;
        }

        editor = document.createElement(
            "section"
        );

        editor.id =
            "promos-demos-editor";

        editor.className =
            "editor";

        editor.hidden = true;

        root.appendChild(editor);

        return editor;
    }

    function ensurePromosPermissions() {
        let section = $(
            "promos-demos-permissions"
        );

        if (!section) {
            const root = main();

            if (!root) {
                return null;
            }

            section = document.createElement(
                "section"
            );

            section.id =
                "promos-demos-permissions";

            section.className =
                "editor";

            section.hidden = true;

            root.appendChild(section);
        }

        let content = $(
            "promos-demos-permissions-content"
        );

        if (!content) {
            content = document.createElement(
                "div"
            );

            content.id =
                "promos-demos-permissions-content";

            section.appendChild(content);
        }

        return {
            section,
            content
        };
    }

    /*
    ==================================================
    PROMOS BUTTONS
    ==================================================
    */

    function installPromosButtons() {
        if (
            document.body.dataset.page !==
            "promosDemos"
        ) {
            return;
        }

        const head =
            document.querySelector(
                ".content-shell-header"
            );

        if (!head) {
            return;
        }

        let actions =
            head.querySelector(
                ".staffhub-promos-actions"
            );

        if (!actions) {
            actions = document.createElement(
                "div"
            );

            actions.className =
                "staffhub-promos-actions";

            head.appendChild(actions);
        }

        if (
            hasEdit("promosDemos") &&
            !actions.querySelector(
                ".staffhub-promos-edit"
            )
        ) {
            const edit =
                document.createElement(
                    "button"
                );

            edit.type = "button";
            edit.className =
                "icon-button staffhub-promos-edit";
            edit.title =
                "Edit Promos & Demos";
            edit.textContent = "✎";

            edit.onclick =
                () =>
                    window.openDocumentEditor(
                        "promosDemos"
                    );

            actions.appendChild(edit);
        }

        if (
            isFounder() &&
            !actions.querySelector(
                ".staffhub-promos-permissions"
            )
        ) {
            const gear =
                document.createElement(
                    "button"
                );

            gear.type = "button";
            gear.className =
                "icon-button staffhub-promos-permissions";
            gear.title =
                "Edit Promos & Demos Permissions";
            gear.textContent = "⚙";

            gear.onclick =
                () =>
                    window.openPagePermissions(
                        "promosDemos"
                    );

            actions.appendChild(gear);
        }
    }

    /*
    ==================================================
    DOCUMENT ATTACHMENTS
    ==================================================
    */

    function readAttachmentData(
        categoryId
    ) {
        const input = $(
            `attachment-data-${categoryId}`
        );

        if (!input) {
            return [];
        }

        try {
            const parsed =
                JSON.parse(
                    input.value || "[]"
                );

            return Array.isArray(parsed)
                ? parsed
                : [];
        } catch {
            return [];
        }
    }

    function renderDocumentAttachmentUI(
        categoryId
    ) {
        const container = $(
            `attachments-${categoryId}`
        );

        if (!container) {
            return;
        }

        const attachments =
            readAttachmentData(
                categoryId
            );

        if (!attachments.length) {
            container.innerHTML = `
                <div class="empty-state attachment-empty">
                    No attachments added.
                </div>
            `;

            return;
        }

        container.innerHTML =
            attachments
                .map(attachment => {
                    const url =
                        typeof window.getAttachmentUrl ===
                        "function"
                            ? window.getAttachmentUrl(
                                attachment.url
                            )
                            : attachment.url;

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
                            data-attachment-id="${esc(
                                attachment.id
                            )}"
                        >

                            <div class="editor-attachment-preview">
                                ${
                                    isImage
                                        ? `
                                            <img
                                                src="${esc(url)}"
                                                alt="${esc(
                                                    attachment.name ||
                                                    "Attachment"
                                                )}"
                                                onclick="openImageViewer('${esc(url)}')"
                                            >
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
                                    ${esc(
                                        attachment.name ||
                                        "Attachment"
                                    )}
                                </strong>

                                ${
                                    attachment.size
                                        ? `
                                            <span>
                                                ${
                                                    typeof window.formatFileSize ===
                                                    "function"
                                                        ? window.formatFileSize(
                                                            attachment.size
                                                        )
                                                        : ""
                                                }
                                            </span>
                                        `
                                        : ""
                                }
                            </div>

                            <button
                                type="button"
                                class="btn btn-danger editor-attachment-remove"
                                data-category-id="${esc(
                                    categoryId
                                )}"
                                data-attachment-id="${esc(
                                    attachment.id
                                )}"
                            >
                                REMOVE
                            </button>

                        </div>
                    `;
                })
                .join("");

        container
            .querySelectorAll(
                ".editor-attachment-remove"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();
                        event.stopPropagation();

                        removeDocumentAttachmentFixed(
                            button.dataset.categoryId,
                            button.dataset.attachmentId
                        );
                    }
                );
            });
    }

    function removeDocumentAttachmentFixed(
        categoryId,
        attachmentId
    ) {
        const input = $(
            `attachment-data-${categoryId}`
        );

        if (!input) {
            return;
        }

        const attachments =
            readAttachmentData(
                categoryId
            ).filter(
                attachment =>
                    String(attachment.id) !==
                    String(attachmentId)
            );

        input.value =
            JSON.stringify(
                attachments
            );

        renderDocumentAttachmentUI(
            categoryId
        );
    }

    async function handleDocumentAttachmentsFixed(
        pageName,
        categoryId,
        files
    ) {
        const selected =
            Array.from(files || []);

        if (!selected.length) {
            return;
        }

        try {
            const uploaded =
                await window.uploadAttachments(
                    selected,
                    pageName
                );

            const input = $(
                `attachment-data-${categoryId}`
            );

            if (!input) {
                return;
            }

            const existing =
                readAttachmentData(
                    categoryId
                );

            input.value =
                JSON.stringify(
                    existing.concat(
                        uploaded || []
                    )
                );

            renderDocumentAttachmentUI(
                categoryId
            );

            const fileInput = $(
                `document-files-${categoryId}`
            );

            if (fileInput) {
                fileInput.value = "";
            }

        } catch (error) {
            alert(
                error.message ||
                "Upload failed."
            );
        }
    }

    window.handleDocumentAttachments =
        handleDocumentAttachmentsFixed;

    window.removeDocumentAttachment =
        removeDocumentAttachmentFixed;

    /*
    ==================================================
    COMMAND EDITOR
    ==================================================
    */

    async function openCommandEditorFixed() {
        const editor =
            $("command-editor");

        if (!editor) {
            console.error(
                "StaffHub: command-editor is missing."
            );

            return;
        }

        if (
            !window.pagePermission ||
            !window.pagePermission(
                "commands",
                "edit"
            )
        ) {
            return;
        }

        enterEditor(editor);

        editor.innerHTML = `
            <div class="editor-panel">
                <div class="editor-header">
                    <div>
                        <div class="section-label">
                            COMMAND EDITOR
                        </div>

                        <h2>
                            Manage Commands
                        </h2>

                        <p>
                            Loading command configuration...
                        </p>
                    </div>

                    <button
                        class="btn btn-secondary"
                        type="button"
                        onclick="closeCommandEditor()"
                    >
                        CLOSE
                    </button>
                </div>

                <div
                    id="command-editor-list"
                    class="staffhub-command-editor-list"
                >
                    <div class="empty-state">
                        Loading commands...
                    </div>
                </div>
            </div>
        `;

        try {
            const data =
                await window.api(
                    "/api/staffhub/commands"
                );

            window.commandCategories =
                data.categories || [];

            if (
                typeof window.loadCommandRoles ===
                "function"
            ) {
                try {
                    await Promise.race([
                        window.loadCommandRoles(),
                        new Promise(resolve =>
                            setTimeout(
                                resolve,
                                5000
                            )
                        )
                    ]);
                } catch {}
            }

            if (
                typeof window.renderCommandEditor ===
                "function"
            ) {
                window.renderCommandEditor();
            }

            installAllUploads();

        } catch (error) {
            const list = $(
                "command-editor-list"
            );

            if (list) {
                list.innerHTML = `
                    <div class="staffhub-fix-error">
                        <strong>
                            Could not load commands
                        </strong>
                        <span>
                            ${esc(
                                error.message
                            )}
                        </span>
                    </div>
                `;
            }
        }
    }

    window.openCommandEditor =
        openCommandEditorFixed;

    /*
    ==================================================
    DOCUMENT EDITOR
    ==================================================
    */

    async function openDocumentEditorFixed(
        pageName
    ) {
        if (!hasEdit(pageName)) {
            return;
        }

        let editorId =
            pageName === "promosDemos"
                ? "promos-demos-editor"
                : `${pageName}-editor`;

        let editor = $(editorId);

        if (
            !editor &&
            pageName === "promosDemos"
        ) {
            editor =
                ensurePromosEditor();
        }

        if (!editor) {
            return;
        }

        enterEditor(editor);

        editor.innerHTML = `
            <div class="editor-panel">
                <div class="editor-header">
                    <div>
                        <div class="section-label">
                            ${
                                esc(
                                    window.PAGE_INFO?.[
                                        pageName
                                    ]?.title ||
                                    pageName
                                ).toUpperCase()
                            }
                            EDITOR
                        </div>

                        <h2>
                            Manage Content
                        </h2>

                        <p>
                            Manage categories, text and attachments.
                        </p>
                    </div>

                    <button
                        class="btn btn-secondary"
                        type="button"
                        onclick="closeDocumentEditor('${esc(
                            pageName
                        )}')"
                    >
                        CLOSE
                    </button>
                </div>

                <div id="${esc(
                    pageName
                )}-editor-loading">
                    <div class="empty-state">
                        Loading content...
                    </div>
                </div>
            </div>
        `;

        try {
            const data =
                await window.api(
                    `/api/staffhub/${pageName}`
                );

            if (
                typeof window.renderDocumentEditor ===
                "function"
            ) {
                window.renderDocumentEditor(
                    pageName,
                    data.page
                );
            }

            installAllUploads();

            /*
            After the original renderer creates
            its attachment controls, replace
            their event handlers with ours.
            */

            document
                .querySelectorAll(
                    'input[id^="document-files-"]'
                )
                .forEach(input => {
                    input.onchange = null;

                    input.addEventListener(
                        "change",
                        event => {
                            const match =
                                input.id.match(
                                    /^document-files-(.+)$/
                                );

                            if (!match) {
                                return;
                            }

                            handleDocumentAttachmentsFixed(
                                pageName,
                                match[1],
                                event.target.files
                            );
                        }
                    );
                });

            document
                .querySelectorAll(
                    '[id^="attachments-"]'
                )
                .forEach(container => {
                    const categoryId =
                        container.id.replace(
                            "attachments-",
                            ""
                        );

                    renderDocumentAttachmentUI(
                        categoryId
                    );
                });

        } catch (error) {
            editor.innerHTML = `
                <div class="editor-panel">
                    <div class="section-label">
                        EDITOR ERROR
                    </div>

                    <h2>
                        Could not load editor
                    </h2>

                    <div class="staffhub-fix-error">
                        ${esc(
                            error.message
                        )}
                    </div>

                    <div class="form-actions">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            onclick="staffhubExitEditorMode()"
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            `;
        }
    }

    window.openDocumentEditor =
        openDocumentEditorFixed;

    /*
    ==================================================
    ANNOUNCEMENTS
    ==================================================
    */

    async function deleteAnnouncementFixed(
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
            await window.api(
                `/api/staffhub/announcements/${id}`,
                {
                    method: "DELETE"
                }
            );

            /*
            IMPORTANT:
            Wait for the API refresh before
            doing anything else.
            */

            await window.renderAnnouncements();

        } catch (error) {
            alert(
                error.message ||
                "Could not delete announcement."
            );
        }
    }

    window.deleteAnnouncement =
        deleteAnnouncementFixed;

    /*
    ==================================================
    ANNOUNCEMENT ATTACHMENTS
    ==================================================
    */

    async function handleAnnouncementAttachmentsFixed(
        files
    ) {
        const selected =
            Array.from(files || []);

        if (!selected.length) {
            return;
        }

        try {
            const uploaded =
                await window.uploadAttachments(
                    selected,
                    "announcements"
                );

            const input = $(
                "announcement-attachment-data"
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
                    existing.concat(
                        uploaded || []
                    )
                );

            if (
                typeof window.renderAnnouncementAttachmentPreview ===
                "function"
            ) {
                window.renderAnnouncementAttachmentPreview();
            }

            const fileInput = $(
                "announcement-files"
            );

            if (fileInput) {
                fileInput.value = "";
            }

        } catch (error) {
            alert(
                error.message ||
                "Upload failed."
            );
        }
    }

    window.handleAnnouncementAttachments =
        handleAnnouncementAttachmentsFixed;

    /*
    ==================================================
    PERMISSIONS
    ==================================================
    */

    async function openPagePermissionsFixed(
        pageName
    ) {
        if (!isFounder()) {
            return;
        }

        let section;
        let content;

        if (
            pageName === "promosDemos"
        ) {
            const target =
                ensurePromosPermissions();

            if (!target) {
                return;
            }

            section =
                target.section;

            content =
                target.content;
        } else {
            section = $(
                pageName === "commands"
                    ? "command-permissions"
                    : `${pageName}-permissions`
            );

            if (!section) {
                return;
            }

            content =
                $(
                    pageName === "commands"
                        ? "command-permissions-content"
                        : `${pageName}-permissions-content`
                );

            if (!content) {
                content =
                    document.createElement(
                        "div"
                    );

                content.id =
                    pageName === "commands"
                        ? "command-permissions-content"
                        : `${pageName}-permissions-content`;

                section.appendChild(
                    content
                );
            }
        }

        enterEditor(section);

        content.innerHTML = `
            <div class="editor-panel">
                <div class="section-label">
                    PAGE PERMISSIONS
                </div>

                <h2>
                    Loading permissions...
                </h2>

                <p>
                    Loading Discord roles and access settings.
                </p>
            </div>
        `;

        try {
            const data =
                await window.api(
                    "/api/staffhub/permissions"
                );

            const roles =
                typeof window.loadPermissionRoles ===
                "function"
                    ? await window.loadPermissionRoles()
                    : [];

            if (
                typeof window.renderPermissionsEditor ===
                "function"
            ) {
                window.renderPermissionsEditor(
                    content.id,
                    pageName,
                    data.permissions,
                    roles
                );
            }

        } catch (error) {
            content.innerHTML = `
                <div class="staffhub-fix-error">
                    <strong>
                        Could not load permissions
                    </strong>

                    <span>
                        ${esc(
                            error.message
                        )}
                    </span>
                </div>
            `;
        }
    }

    window.openPagePermissions =
        openPagePermissionsFixed;

    /*
    ==================================================
    CLOSE FUNCTIONS
    ==================================================
    */

    function patchClose(
        name
    ) {
        if (
            typeof window[name] !==
            "function"
        ) {
            return;
        }

        window[name] = function (...args) {
            const result =
                window[
                    `__staffhub_original_${name}`
                ]?.(...args);

            exitEditor();

            return result;
        };
    }

    [
        "closeCommandEditor",
        "closeDocumentEditor",
        "closeTicketsEditor",
        "closeEtiquetteEditor",
        "closeAnnouncementsEditor",
        "closePagePermissions",
        "closeCommandPermissions",
        "closeTicketsPermissions",
        "closeEtiquettePermissions",
        "closeAnnouncementsPermissions",
        "closePromosDemosPermissions"
    ].forEach(name => {
        if (
            typeof window[name] ===
            "function" &&
            !window[
                `__staffhub_original_${name}`
            ]
        ) {
            window[
                `__staffhub_original_${name}`
            ] = window[name];

            window[name] =
                function (...args) {
                    const result =
                        window[
                            `__staffhub_original_${name}`
                        ](...args);

                    exitEditor();

                    return result;
                };
        }
    });

    /*
    ==================================================
    PROMOS & DEMOS
    ==================================================
    */

    function renderCompactActivity() {
        const list =
            $("staff-activity-results");

        if (!list) {
            return;
        }

        const data =
            Array.isArray(
                window.staffActivityData
            )
                ? window.staffActivityData
                : [];

        const filters =
            window.staffActivityFilters ||
            {
                type: "all",
                member: "all",
                executor: "all"
            };

        const filtered =
            data.filter(update => {
                if (
                    filters.type !== "all" &&
                    String(
                        update.type || ""
                    ).toLowerCase() !==
                        filters.type
                ) {
                    return false;
                }

                if (
                    filters.member !== "all" &&
                    update.memberId !==
                        filters.member
                ) {
                    return false;
                }

                if (
                    filters.executor !== "all" &&
                    update.updatedBy?.id !==
                        filters.executor
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
            filtered.map(update => {
                const oldRoles =
                    Array.isArray(
                        update.oldRoles
                    )
                        ? update.oldRoles
                        : [];

                const newRoles =
                    Array.isArray(
                        update.newRoles
                    )
                        ? update.newRoles
                        : [];

                const oldText =
                    oldRoles.length
                        ? oldRoles
                            .map(
                                role =>
                                    role.name
                            )
                            .join(", ")
                        : "None";

                const newText =
                    newRoles.length
                        ? newRoles
                            .map(
                                role =>
                                    role.name
                            )
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

                const date =
                    typeof window.formatDate ===
                    "function"
                        ? window.formatDate(
                            update.date
                        )
                        : "";

                const id =
                    `promo-${esc(
                        update.memberId ||
                        Math.random()
                    )}-${Math.random()
                        .toString(36)
                        .slice(2)}`;

                return `
                    <article
                        class="staffhub-promo-card"
                    >

                        <div class="staffhub-promo-main">

                            <div class="staffhub-promo-person">
                                <strong>
                                    ${esc(
                                        update.displayName ||
                                        update.username ||
                                        "Unknown"
                                    )}
                                </strong>

                                <span>
                                    ${esc(
                                        getActivityLabelSafe(
                                            update.type
                                        )
                                    )}
                                </span>
                            </div>

                            <button
                                type="button"
                                class="btn btn-secondary staffhub-promo-view"
                                data-target="${id}"
                            >
                                VIEW ALL
                            </button>

                        </div>

                        <div
                            id="${id}"
                            class="staffhub-promo-details"
                            hidden
                        >

                            <div class="staffhub-promo-detail-grid">

                                <div>
                                    <small>FROM</small>
                                    <strong>
                                        ${esc(oldText)}
                                    </strong>
                                </div>

                                <div>
                                    <small>TO</small>
                                    <strong>
                                        ${esc(newText)}
                                    </strong>
                                </div>

                                <div>
                                    <small>PERFORMED BY</small>
                                    <strong>
                                        ${esc(executor)}
                                    </strong>
                                </div>

                                <div>
                                    <small>DATE</small>
                                    <strong>
                                        ${esc(date)}
                                    </strong>
                                </div>

                            </div>

                        </div>

                    </article>
                `;
            })
            .join("");

        list
            .querySelectorAll(
                ".staffhub-promo-view"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        const target =
                            $(
                                button.dataset.target
                            );

                        if (!target) {
                            return;
                        }

                        const opening =
                            target.hidden;

                        target.hidden =
                            !opening;

                        button.textContent =
                            opening
                                ? "SHOW LESS"
                                : "VIEW ALL";
                    }
                );
            });
    }

    function getActivityLabelSafe(
        type
    ) {
        const normalized =
            String(
                type || ""
            ).toLowerCase();

        const labels = {
            promotion: "PROMOTION",
            demotion: "DEMOTION",
            hire: "HIRE",
            removal: "FIRE / REMOVAL",
            resignation: "RESIGNATION",
            demo: "DEMO",
            demos: "DEMO",
            demonstration: "DEMO"
        };

        return (
            labels[normalized] ||
            normalized
                .replaceAll("_", " ")
                .toUpperCase() ||
            "ACTIVITY"
        );
    }

    /*
    Replace the activity renderer once the
    original function exists.
    */

    function patchActivityRenderer() {
        if (
            typeof window.renderActivityResults !==
            "function"
        ) {
            return;
        }

        if (
            window.__staffhubActivityRendererFixed
        ) {
            return;
        }

        window.__staffhubActivityRendererFixed =
            true;

        window.renderActivityResults =
            renderCompactActivity;
    }

    /*
    ==================================================
    UPLOAD PREVIEWS
    ==================================================
    */

    function installUploadPreview(
        input
    ) {
        if (!input) {
            return;
        }

        if (
            input.dataset
                .staffhubUploadFixed ===
            "1"
        ) {
            return;
        }

        input.dataset
            .staffhubUploadFixed =
            "1";

        const preview =
            document.createElement(
                "div"
            );

        preview.className =
            "staffhub-local-upload-preview";

        input.insertAdjacentElement(
            "afterend",
            preview
        );

        let files = [];

        function sync() {
            try {
                const dt =
                    new DataTransfer();

                files.forEach(file =>
                    dt.items.add(file)
                );

                input.files =
                    dt.files;
            } catch {}
        }

        function render() {
            preview.innerHTML =
                files
                    .map(
                        (file, index) => `
                            <div class="staffhub-local-upload-item">

                                <span>
                                    ${esc(
                                        file.name
                                    )}
                                </span>

                                <button
                                    type="button"
                                    title="Remove"
                                    aria-label="Remove ${esc(
                                        file.name
                                    )}"
                                    data-index="${index}"
                                >
                                    ×
                                </button>

                            </div>
                        `
                    )
                    .join("");

            preview
                .querySelectorAll(
                    "button"
                )
                .forEach(button => {
                    button.onclick =
                        event => {
                            event.preventDefault();
                            event.stopPropagation();

                            files.splice(
                                Number(
                                    button.dataset.index
                                ),
                                1
                            );

                            sync();
                            render();
                        };
                });
        }

        input.addEventListener(
            "change",
            () => {
                files =
                    Array.from(
                        input.files || []
                    );

                render();
            }
        );
    }

    function installAllUploads() {
        document
            .querySelectorAll(
                'input[type="file"]'
            )
            .forEach(
                installUploadPreview
            );
    }

    /*
    ==================================================
    INITIALIZATION
    ==================================================
    */

    function initialize() {
        installPromosButtons();
        installAllUploads();

        patchActivityRenderer();

        setTimeout(() => {
            installPromosButtons();
            installAllUploads();
            patchActivityRenderer();
        }, 500);

        setTimeout(() => {
            installPromosButtons();
            installAllUploads();
            patchActivityRenderer();
        }, 1500);

        document.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Escape" &&
                    document.body.classList.contains(
                        "staffhub-editor-mode"
                    )
                ) {
                    exitEditor();
                }
            }
        );

        document.addEventListener(
            "click",
            event => {
                const close =
                    event.target.closest(
                        "[data-staffhub-close-editor]"
                    );

                if (close) {
                    event.preventDefault();
                    exitEditor();
                }
            }
        );

        const observer =
            new MutationObserver(() => {
                installPromosButtons();
                installAllUploads();
                patchActivityRenderer();
            });

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );
    } else {
        initialize();
    }
})();

