/*
==================================================
XOTIC STAFFHUB - FINAL FIXES
==================================================

This file intentionally sits AFTER staffhub.js.

It fixes:
- Consistent page width
- Proper editor mode
- Editors replacing normal page content
- Command editor loading
- Permissions editors
- Announcement permissions
- Etiquette permissions
- Tickets permissions
- Promos & Demos permissions
- Promos & Demos compact view
- Upload previews
- Immediate upload removal
- Better attachment handling
- Mobile editor layout
- Escape-to-close
*/

(function () {
    "use strict";

    /*
    ==================================================
    HELPERS
    ==================================================
    */

    const $ = id => document.getElementById(id);

    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function withTimeout(promise, ms, message) {
        let timer;

        const timeout = new Promise((_, reject) => {
            timer = setTimeout(() => {
                reject(new Error(message));
            }, ms);
        });

        try {
            return await Promise.race([
                promise,
                timeout
            ]);
        } finally {
            clearTimeout(timer);
        }
    }

    function hasPermission(page, type = "view") {
        if (typeof window.pagePermission !== "function") {
            return false;
        }

        return window.pagePermission(page, type);
    }

    function getMain() {
        return document.querySelector(".hub-main") ||
               document.querySelector(".staff-page");
    }

    /*
    ==================================================
    EDITOR MODE
    ==================================================

    When an editor opens, the actual page disappears.

    The user sees ONLY the editor.
    */

    function enterEditorMode(editor) {
        if (!editor) return;

        const main = getMain();

        document.body.classList.add(
            "staffhub-editor-mode"
        );

        if (main) {
            main.querySelectorAll(
                ".page-head, " +
                ".announcement-list, " +
                ".document, " +
                ".content-shell, " +
                ".updates-list, " +
                ".command-list, " +
                ".hub-grid, " +
                ".hub-card, " +
                ".staff-page-content"
            ).forEach(element => {
                if (element !== editor &&
                    !editor.contains(element)) {
                    element.classList.add(
                        "staffhub-editor-hidden"
                    );
                }
            });

            main.querySelectorAll(".editor").forEach(section => {
                section.classList.remove(
                    "staffhub-active-editor"
                );

                if (section !== editor) {
                    section.hidden = true;
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

    window.staffhubEnterEditorMode =
        enterEditorMode;

    function exitEditorMode() {
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

    window.staffhubExitEditorMode =
        exitEditorMode;

    /*
    ==================================================
    EDITOR CLOSE BUTTONS
    ==================================================
    */

    function closeKnownEditor(id) {
        const editor = $(id);

        if (editor) {
            editor.hidden = true;
            editor.classList.remove(
                "staffhub-active-editor"
            );
        }

        exitEditorMode();
    }

    /*
    ==================================================
    UPLOAD PREVIEW SYSTEM
    ==================================================
    */

    function installUploadPreview(input) {
        if (!input) return;

        if (
            input.dataset.staffhubPreviewInstalled === "1"
        ) {
            return;
        }

        input.dataset.staffhubPreviewInstalled = "1";

        const wrapper =
            input.parentElement;

        if (!wrapper) return;

        let preview =
            wrapper.querySelector(
                ".staffhub-upload-previews"
            );

        if (!preview) {
            preview =
                document.createElement("div");

            preview.className =
                "staffhub-upload-previews";

            input.insertAdjacentElement(
                "afterend",
                preview
            );
        }

        let files = [];

        function syncFiles() {
            try {
                const dataTransfer =
                    new DataTransfer();

                files.forEach(file => {
                    dataTransfer.items.add(file);
                });

                input.files =
                    dataTransfer.files;

            } catch (error) {
                console.warn(
                    "StaffHub could not sync files:",
                    error
                );
            }
        }

        function render() {
            preview.innerHTML = "";

            files.forEach((file, index) => {
                const card =
                    document.createElement("div");

                card.className =
                    "staffhub-upload-preview";

                if (
                    file.type &&
                    file.type.startsWith("image/")
                ) {
                    const image =
                        document.createElement("img");

                    const objectUrl =
                        URL.createObjectURL(file);

                    image.src =
                        objectUrl;

                    image.alt =
                        file.name;

                    image.onload =
                        () => {
                            URL.revokeObjectURL(
                                objectUrl
                            );
                        };

                    card.appendChild(image);
                } else {
                    const fileIcon =
                        document.createElement("div");

                    fileIcon.className =
                        "staffhub-upload-file-icon";

                    fileIcon.textContent =
                        "FILE";

                    card.appendChild(
                        fileIcon
                    );
                }

                const info =
                    document.createElement("div");

                info.className =
                    "staffhub-upload-preview-info";

                info.textContent =
                    file.name;

                card.appendChild(info);

                const remove =
                    document.createElement("button");

                remove.type =
                    "button";

                remove.className =
                    "staffhub-upload-remove";

                remove.textContent =
                    "×";

                remove.title =
                    "Remove attachment";

                remove.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();
                        event.stopPropagation();

                        files.splice(
                            index,
                            1
                        );

                        syncFiles();
                        render();

                        input.dispatchEvent(
                            new CustomEvent(
                                "staffhub:file-removed",
                                {
                                    bubbles: true,
                                    detail: {
                                        file
                                    }
                                }
                            )
                        );
                    }
                );

                card.appendChild(
                    remove
                );

                preview.appendChild(
                    card
                );
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

        /*
        Drag and drop
        */

        const zone =
            input.closest(
                ".staffhub-upload-zone"
            );

        if (zone) {
            [
                "dragenter",
                "dragover"
            ].forEach(eventName => {
                zone.addEventListener(
                    eventName,
                    event => {
                        event.preventDefault();
                        zone.classList.add(
                            "dragover"
                        );
                    }
                );
            });

            [
                "dragleave",
                "drop"
            ].forEach(eventName => {
                zone.addEventListener(
                    eventName,
                    event => {
                        event.preventDefault();
                        zone.classList.remove(
                            "dragover"
                        );
                    }
                );
            });

            zone.addEventListener(
                "drop",
                event => {
                    const dropped =
                        Array.from(
                            event.dataTransfer.files || []
                        );

                    files =
                        dropped;

                    syncFiles();
                    render();

                    input.dispatchEvent(
                        new Event(
                            "change",
                            {
                                bubbles: true
                            }
                        )
                    );
                }
            );
        }
    }

    function installAllUploadPreviews() {
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
    COMMAND EDITOR
    ==================================================
    */

    function installCommandEditor() {
        if (
            typeof window.openCommandEditor !==
            "function"
        ) {
            return;
        }

        if (
            window.__xoticFinalCommandEditor
        ) {
            return;
        }

        window.__xoticFinalCommandEditor =
            true;

        const originalOpen =
            window.openCommandEditor;

        const originalRender =
            window.renderCommandEditor;

        window.openCommandEditor =
            async function () {

                const editor =
                    $("command-editor");

                if (!editor) {
                    console.error(
                        "StaffHub: command-editor element missing."
                    );

                    return;
                }

                enterEditorMode(
                    editor
                );

                editor.innerHTML = `
                    <div class="editor-panel">
                        <div class="section-label">
                            COMMAND EDITOR
                        </div>

                        <h2>
                            Loading commands...
                        </h2>

                        <p class="editor-help">
                            Loading the command configuration.
                        </p>
                    </div>
                `;

                try {

                    /*
                    Load commands first.
                    */

                    if (
                        typeof window.loadCommands ===
                        "function"
                    ) {
                        await withTimeout(
                            window.loadCommands(),
                            10000,
                            "Command data took too long to load."
                        );
                    }

                    /*
                    Render immediately.
                    */

                    if (
                        typeof originalRender ===
                        "function"
                    ) {
                        originalRender();
                    }

                    /*
                    Roles are secondary.
                    Do NOT block the editor on them.
                    */

                    if (
                        typeof window.loadCommandRoles ===
                        "function"
                    ) {
                        try {
                            await withTimeout(
                                window.loadCommandRoles(),
                                6000,
                                "Command roles took too long to load."
                            );

                            if (
                                typeof originalRender ===
                                "function"
                            ) {
                                originalRender();
                            }

                        } catch (roleError) {
                            console.warn(
                                "StaffHub command roles failed:",
                                roleError
                            );
                        }
                    }

                    installAllUploadPreviews();

                    window.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: "instant"
                    });

                } catch (error) {

                    console.error(
                        "StaffHub command editor failed:",
                        error
                    );

                    editor.innerHTML = `
                        <div class="editor-panel">
                            <div class="section-label">
                                COMMAND EDITOR
                            </div>

                            <h2>
                                Could not load commands
                            </h2>

                            <div class="staffhub-fix-error">
                                ${esc(error.message)}
                            </div>

                            <div class="form-actions">
                                <button
                                    type="button"
                                    class="btn btn-secondary"
                                    onclick="staffhubExitEditorMode()">
                                    CLOSE
                                </button>
                            </div>
                        </div>
                    `;
                }
            };
    }

    /*
    ==================================================
    DOCUMENT EDITORS
    ==================================================
    */

    function installDocumentEditor() {
        if (
            typeof window.openDocumentEditor !==
            "function"
        ) {
            return;
        }

        if (
            window.__xoticFinalDocumentEditor
        ) {
            return;
        }

        window.__xoticFinalDocumentEditor =
            true;

        const originalOpen =
            window.openDocumentEditor;

        const originalRender =
            window.renderDocumentEditor;

        window.openDocumentEditor =
            async function (pageName) {

                if (
                    !hasPermission(
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
                    $(editorId);

                if (!editor) {
                    console.error(
                        "StaffHub editor missing:",
                        editorId
                    );

                    return;
                }

                enterEditorMode(
                    editor
                );

                editor.innerHTML = `
                    <div class="editor-panel">
                        <div class="section-label">
                            EDITOR
                        </div>

                        <h2>
                            Loading...
                        </h2>

                        <p class="editor-help">
                            Fetching the current configuration.
                        </p>
                    </div>
                `;

                try {

                    const data =
                        await withTimeout(
                            window.api(
                                `/api/staffhub/${pageName}`
                            ),
                            10000,
                            "The editor request timed out."
                        );

                    if (
                        typeof originalRender ===
                        "function"
                    ) {
                        originalRender(
                            pageName,
                            data.page
                        );
                    } else {
                        /*
                        Fallback to original function
                        if the renderer is not globally available.
                        */

                        await originalOpen(
                            pageName
                        );
                    }

                    installAllUploadPreviews();

                    window.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: "instant"
                    });

                } catch (error) {

                    console.error(
                        "StaffHub document editor failed:",
                        error
                    );

                    editor.innerHTML = `
                        <div class="editor-panel">
                            <div class="section-label">
                                EDITOR ERROR
                            </div>

                            <h2>
                                Could not load editor
                            </h2>

                            <div class="staffhub-fix-error">
                                ${esc(error.message)}
                            </div>

                            <div class="form-actions">
                                <button
                                    type="button"
                                    class="btn btn-secondary"
                                    onclick="staffhubExitEditorMode()">
                                    CLOSE
                                </button>
                            </div>
                        </div>
                    `;
                }
            };
    }

    /*
    ==================================================
    ANNOUNCEMENT EDITOR
    ==================================================
    */

    function installAnnouncementEditor() {
        if (
            typeof window.openAnnouncementsEditor !==
            "function"
        ) {
            return;
        }

        if (
            window.__xoticFinalAnnouncementEditor
        ) {
            return;
        }

        window.__xoticFinalAnnouncementEditor =
            true;

        const original =
            window.openAnnouncementsEditor;

        window.openAnnouncementsEditor =
            function () {

                const editor =
                    $("announcements-editor");

                if (!editor) {
                    return;
                }

                enterEditorMode(
                    editor
                );

                try {
                    original();

                    /*
                    The original renderer may replace
                    the editor contents.
                    */

                    setTimeout(
                        installAllUploadPreviews,
                        50
                    );

                    setTimeout(
                        installAllUploadPreviews,
                        300
                    );

                } catch (error) {

                    console.error(
                        error
                    );

                    editor.innerHTML = `
                        <div class="editor-panel">
                            <h2>
                                Announcement editor error
                            </h2>

                            <div class="staffhub-fix-error">
                                ${esc(error.message)}
                            </div>
                        </div>
                    `;
                }

                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: "instant"
                });
            };
    }

    /*
    ==================================================
    PERMISSIONS
    ==================================================
    */

    function ensurePermissionContainer(
        pageName
    ) {

        let sectionId;

        if (
            pageName === "promosDemos"
        ) {
            sectionId =
                "promos-demos-permissions";
        } else {
            sectionId =
                `${pageName}-permissions`;
        }

        let section =
            $(sectionId);

        if (!section) {

            const main =
                getMain();

            if (!main) {
                return null;
            }

            section =
                document.createElement(
                    "section"
                );

            section.id =
                sectionId;

            section.className =
                "editor";

            section.hidden =
                true;

            main.appendChild(
                section
            );
        }

        let content =
            $(
                `${sectionId}-content`
            );

        if (!content) {

            content =
                document.createElement(
                    "div"
                );

            content.id =
                `${sectionId}-content`;

            section.appendChild(
                content
            );
        }

        return {
            section,
            content
        };
    }

    function installPermissions() {

        if (
            typeof window.openPagePermissions !==
            "function"
        ) {
            return;
        }

        if (
            window.__xoticFinalPermissions
        ) {
            return;
        }

        window.__xoticFinalPermissions =
            true;

        const original =
            window.openPagePermissions;

        window.openPagePermissions =
            async function (pageName) {

                if (
                    !hasPermission(
                        pageName,
                        "manage"
                    ) &&
                    !hasPermission(
                        pageName,
                        "permissions"
                    ) &&
                    !hasPermission(
                        pageName,
                        "edit"
                    )
                ) {
                    /*
                    Do not silently clear the page.
                    Let the original permission logic
                    handle access if it has one.
                    */
                }

                const target =
                    ensurePermissionContainer(
                        pageName
                    );

                if (!target) {
                    return;
                }

                const {
                    section,
                    content
                } = target;

                enterEditorMode(
                    section
                );

                content.innerHTML = `
                    <div class="editor-panel">
                        <div class="section-label">
                            PERMISSIONS
                        </div>

                        <h2>
                            Loading permissions...
                        </h2>

                        <p class="editor-help">
                            Loading the available staff roles.
                        </p>
                    </div>
                `;

                try {

                    /*
                    Use the original permission
                    renderer rather than rebuilding
                    its API logic.
                    */

                    await withTimeout(
                        original(
                            pageName
                        ),
                        10000,
                        "Permission editor took too long to load."
                    );

                    /*
                    Original may have rendered
                    into the same section.
                    */

                    section.hidden =
                        false;

                    section.classList.add(
                        "staffhub-active-editor"
                    );

                    installAllUploadPreviews();

                    window.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: "instant"
                    });

                } catch (error) {

                    console.error(
                        "StaffHub permissions failed:",
                        error
                    );

                    content.innerHTML = `
                        <div class="editor-panel">
                            <div class="section-label">
                                PERMISSIONS
                            </div>

                            <h2>
                                Could not load permissions
                            </h2>

                            <div class="staffhub-fix-error">
                                ${esc(error.message)}
                            </div>

                            <div class="form-actions">
                                <button
                                    type="button"
                                    class="btn btn-secondary"
                                    onclick="staffhubExitEditorMode()">
                                    CLOSE
                                </button>
                            </div>
                        </div>
                    `;
                }
            };
    }

    /*
    ==================================================
    PROMOS & DEMOS
    ==================================================
    */

    function installPromosView() {

        const list =
            $("staff-updates-list");

        if (!list) {
            return;
        }

        if (
            list.dataset.staffhubCompactInstalled ===
            "1"
        ) {
            return;
        }

        list.dataset.staffhubCompactInstalled =
            "1";

        function compactCard(card) {

            if (
                card.dataset.staffhubCompact ===
                "1"
            ) {
                return;
            }

            const children =
                Array.from(
                    card.children
                );

            if (
                children.length <= 2
            ) {
                return;
            }

            /*
            Keep the header and first
            important piece visible.
            Everything else goes
            behind VIEW ALL.
            */

            const visible =
                children.slice(
                    0,
                    Math.min(
                        2,
                        children.length
                    )
                );

            const hidden =
                children.slice(
                    visible.length
                );

            if (!hidden.length) {
                return;
            }

            const details =
                document.createElement(
                    "div"
                );

            details.className =
                "staffhub-promo-details";

            details.hidden =
                true;

            hidden.forEach(
                child =>
                    details.appendChild(
                        child
                    )
            );

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "btn btn-secondary staffhub-view-all";

            button.textContent =
                "VIEW ALL";

            button.addEventListener(
                "click",
                () => {

                    details.hidden =
                        !details.hidden;

                    button.textContent =
                        details.hidden
                            ? "VIEW ALL"
                            : "SHOW LESS";
                }
            );

            card.innerHTML = "";

            visible.forEach(
                child =>
                    card.appendChild(
                        child
                    )
            );

            card.appendChild(
                details
            );

            card.appendChild(
                button
            );

            card.dataset.staffhubCompact =
                "1";
        }

        function run() {
            list
                .querySelectorAll(
                    ".staff-update-card"
                )
                .forEach(
                    compactCard
                );
        }

        run();

        const observer =
            new MutationObserver(
                run
            );

        observer.observe(
            list,
            {
                childList: true,
                subtree: true
            }
        );
    }

    /*
    ==================================================
    CURRENT STAFF
    ==================================================
    */

    function removeUselessCurrentStaffEditAccess() {

        document
            .querySelectorAll(
                ".founder-edit-access, " +
                ".current-staff-edit-access, " +
                "[data-current-staff-edit-access]"
            )
            .forEach(
                element =>
                    element.remove()
            );
    }

    /*
    ==================================================
    CLOSE BUTTON / ESCAPE HANDLING
    ==================================================
    */

    function installCloseHandling() {

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !== "Escape"
                ) {
                    return;
                }

                if (
                    document.body.classList.contains(
                        "staffhub-editor-mode"
                    )
                ) {
                    exitEditorMode();
                }
            }
        );

        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-staffhub-close-editor]"
                    );

                if (!button) {
                    return;
                }

                event.preventDefault();

                exitEditorMode();
            }
        );
    }

    /*
    ==================================================
    PATCH EXISTING CLOSE FUNCTIONS
    ==================================================
    */

    function patchCloseFunction(
        name,
        editorId
    ) {

        if (
            typeof window[name] !==
            "function"
        ) {
            return;
        }

        const marker =
            `__xoticFinal_${name}`;

        if (
            window[marker]
        ) {
            return;
        }

        window[marker] =
            true;

        const original =
            window[name];

        window[name] =
            function (...args) {

                try {
                    original.apply(
                        this,
                        args
                    );
                } catch (error) {
                    console.warn(
                        `StaffHub ${name} failed:`,
                        error
                    );
                }

                const editor =
                    $(editorId);

                if (editor) {
                    editor.hidden =
                        true;

                    editor.classList.remove(
                        "staffhub-active-editor"
                    );
                }

                exitEditorMode();
            };
    }

    function patchCloseFunctions() {

        patchCloseFunction(
            "closeAnnouncementsEditor",
            "announcements-editor"
        );

        patchCloseFunction(
            "closeDocumentEditor",
            "tickets-editor"
        );

        patchCloseFunction(
            "closeTicketsEditor",
            "tickets-editor"
        );

        patchCloseFunction(
            "closeEtiquetteEditor",
            "etiquette-editor"
        );

        patchCloseFunction(
            "closeCommandEditor",
            "command-editor"
        );

        patchCloseFunction(
            "closePromosDemosEditor",
            "promos-demos-editor"
        );
    }

    /*
    ==================================================
    PERMISSION CLOSE BUTTONS
    ==================================================
    */

    function patchPermissionCloseButtons() {

        document
            .querySelectorAll(
                ".editor"
            )
            .forEach(
                editor => {

                    editor
                        .querySelectorAll(
                            "button"
                        )
                        .forEach(
                            button => {

                                const text =
                                    button.textContent
                                        .trim()
                                        .toLowerCase();

                                if (
                                    text === "close" ||
                                    text === "cancel"
                                ) {
                                    button.addEventListener(
                                        "click",
                                        () => {
                                            setTimeout(
                                                exitEditorMode,
                                                0
                                            );
                                        }
                                    );
                                }
                            }
                        );
                }
            );
    }

    /*
    ==================================================
    FIX UPLOAD INPUTS AFTER DYNAMIC RENDERING
    ==================================================
    */

    function installDynamicUploadObserver() {

        const observer =
            new MutationObserver(
                () => {
                    installAllUploadPreviews();
                }
            );

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    }

    /*
    ==================================================
    INITIALIZATION
    ==================================================
    */

    function initialize() {

        installCloseHandling();

        /*
        Wait one tick because staffhub.js
        may still be finishing its startup.
        */

        setTimeout(
            () => {

                installDocumentEditor();
                installCommandEditor();
                installAnnouncementEditor();
                installPermissions();

                installAllUploadPreviews();

                installPromosView();

                removeUselessCurrentStaffEditAccess();

                patchCloseFunctions();

                patchPermissionCloseButtons();

                installDynamicUploadObserver();

            },
            0
        );

        /*
        Run again after the main content
        has finished rendering.
        */

        setTimeout(
            () => {

                installDocumentEditor();
                installCommandEditor();
                installAnnouncementEditor();
                installPermissions();

                installAllUploadPreviews();

                installPromosView();

                removeUselessCurrentStaffEditAccess();

                patchCloseFunctions();

                patchPermissionCloseButtons();

            },
            750
        );

        setTimeout(
            () => {

                installAllUploadPreviews();
                installPromosView();
                removeUselessCurrentStaffEditAccess();

            },
            2000
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