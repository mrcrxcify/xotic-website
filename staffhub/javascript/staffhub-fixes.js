/* Xotic StaffHub Copy 4 fixes and polish */
(function () {
    "use strict";

    function el(id) { return document.getElementById(id); }
    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    const style = document.createElement("style");
    style.textContent = `
        .hub-main{padding-bottom:72px}
        .staff-user-bar{margin:18px auto 0;max-width:1180px;padding:12px 18px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.025)}
        .staff-user-label{color:var(--muted);font-size:11px;letter-spacing:.12em;text-transform:uppercase;margin-right:10px}
        .staff-user-bar #staff-user-display .staff-user-profile{display:inline-flex;align-items:center;gap:10px}
        .staff-user-bar #staff-user-display .staff-user-avatar{width:30px;height:30px;border-radius:50%;object-fit:cover}
        .page-head{margin:34px 0 24px}
        .page-title-row{align-items:flex-start}
        .page-actions{display:flex;gap:10px;align-items:center}
        .icon-button{width:42px;height:42px;border:1px solid var(--border-strong);border-radius:10px;background:rgba(255,255,255,.04);color:var(--text);cursor:pointer}
        .icon-button:hover{border-color:rgba(96,165,250,.55);background:rgba(59,130,246,.08)}
        .document,.command-list,.announcement-list{display:grid;gap:18px}
        .document-category,.command-category,.announcement-card{padding:24px;border:1px solid var(--border);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.018));box-shadow:0 14px 45px rgba(0,0,0,.18)}
        .document-category h2,.command-category h2,.announcement-card h2{margin:8px 0 12px}
        .document-category-description{color:var(--gray);margin-bottom:14px}
        .document-content,.announcement-body{line-height:1.75;color:var(--text)}
        .announcement-top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}
        .announcement-meta{color:var(--muted);font-size:12px;text-align:right;line-height:1.6}
        .announcement-body{margin-top:18px}
        .editor{margin:24px 0}
        .editor-panel{padding:26px;border:1px solid var(--border-strong);border-radius:18px;background:rgba(7,11,20,.9);box-shadow:var(--shadow)}
        .editor-header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:22px}
        .form-grid{gap:18px}
        .form-full label,.permission-box label{display:block;margin-bottom:8px;color:var(--gray);font-size:11px;letter-spacing:.1em;text-transform:uppercase}
        .form-full input,.form-full textarea,.permission-box input,.permission-box select,.activity-filter select{width:100%;box-sizing:border-box}
        .form-full textarea{min-height:180px;resize:vertical}
        .form-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
        .image-preview{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-top:12px}
        .image-item{position:relative;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--dark-2);min-height:110px}
        .image-item img{width:100%;height:110px;object-fit:cover;display:block}
        .image-item button{position:absolute;right:7px;top:7px;width:28px;height:28px;border:0;border-radius:50%;background:rgba(0,0,0,.75);color:#fff;cursor:pointer}
        .document-attachments{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:18px}
        .attachment-card{border:1px solid var(--border);border-radius:12px;overflow:hidden;background:rgba(255,255,255,.025)}
        .attachment-thumbnail{height:150px;cursor:pointer}
        .attachment-thumbnail img{width:100%;height:100%;object-fit:cover}
        .attachment-card-info{padding:10px 12px;display:flex;flex-direction:column;gap:4px}
        .attachment-card-info span{color:var(--muted);font-size:11px}
        .editor-attachment-list{display:grid;gap:10px;margin-top:12px}
        .editor-attachment{display:flex;align-items:center;gap:12px;padding:10px;border:1px solid var(--border);border-radius:12px;background:rgba(255,255,255,.02)}
        .editor-attachment-preview{width:72px;height:58px;flex:0 0 72px;border-radius:8px;overflow:hidden;background:var(--dark-3);display:grid;place-items:center}
        .editor-attachment-preview img{width:100%;height:100%;object-fit:cover}
        .editor-attachment-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
        .editor-attachment-info strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .editor-attachment-info span{color:var(--muted);font-size:11px}
        .permission-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:18px}
        .permission-box{padding:18px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.02)}
        .permission-box h4{margin:0 0 18px}
        .permission-box>*+*{margin-top:12px}
        .role-select{min-height:180px}
        .staffhub-home-hero{padding:42px!important}
        .staffhub-home-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
        .staffhub-home-grid .hub-card{min-height:190px;display:flex;flex-direction:column}
        .staffhub-home-grid .hub-card p{flex:1}
        .content-shell{border:1px solid var(--border);border-radius:18px;background:rgba(255,255,255,.025);overflow:hidden}
        .content-shell-header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding:24px;border-bottom:1px solid var(--border)}
        .updates-list{padding:18px;display:grid;gap:12px}
        .staff-activity-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:12px;padding:16px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.02);margin-bottom:16px}
        .staff-update-card{padding:18px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.02)}
        .staff-update-header{display:flex;justify-content:space-between;gap:12px}
        .staff-update-roles{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
        .staff-update-roles>div{padding:12px;border-radius:10px;background:rgba(255,255,255,.025)}
        .staff-update-roles small{display:block;color:var(--muted);margin-bottom:4px}
        .staff-update-meta{display:flex;justify-content:space-between;gap:12px;color:var(--muted);font-size:12px}
        .staffhub-upload-zone{border:1px dashed rgba(96,165,250,.35);border-radius:14px;padding:22px;text-align:center;background:rgba(255,255,255,.025);cursor:pointer;transition:.2s}
        .staffhub-upload-zone:hover,.staffhub-upload-zone.dragover{border-color:rgba(236,72,153,.7);background:rgba(59,130,246,.07)}
        .staffhub-upload-zone strong{display:block;margin-bottom:6px}
        .staffhub-upload-zone span{display:block;color:var(--gray);font-size:13px}
        .staffhub-upload-zone input{display:none}
        .staffhub-upload-previews{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px;margin-top:14px}
        .staffhub-upload-preview{position:relative;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--dark-2);min-height:100px}
        .staffhub-upload-preview img{display:block;width:100%;height:100px;object-fit:cover}
        .staffhub-upload-preview span{display:block;padding:8px;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .staffhub-fix-error{padding:16px;border:1px solid rgba(239,68,68,.25);border-radius:12px;background:rgba(239,68,68,.06);color:#fca5a5}
        .staffhub-permissions-panel{margin-top:22px}
        @media(max-width:900px){.staffhub-home-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.staff-activity-filters{grid-template-columns:1fr 1fr}.permission-columns{grid-template-columns:1fr}}
        @media(max-width:650px){.staffhub-home-grid{grid-template-columns:1fr}.announcement-top,.content-shell-header{flex-direction:column}.announcement-meta{text-align:left}.staff-update-roles{grid-template-columns:1fr}.staff-update-meta{flex-direction:column}.staffhub-upload-previews{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);

    function mirrorLoggedInUser() {
        const source = el("staff-user");
        if (!source) return;
        let target = el("staff-user-display");
        if (!target) {
            const bar = document.querySelector(".staff-user-bar");
            if (bar) {
                target = document.createElement("div");
                target.id = "staff-user-display";
                target.className = "staffhub-user-display-fix";
                bar.innerHTML = "";
                bar.appendChild(target);
            }
        }
        if (!target) return;
        target.innerHTML = source.innerHTML;
    }

    function installUserMirror() {
        mirrorLoggedInUser();
        const source = el("staff-user");
        if (source && !source.__staffhubObserver) {
            const observer = new MutationObserver(mirrorLoggedInUser);
            observer.observe(source, { childList: true, subtree: true, characterData: true });
            source.__staffhubObserver = observer;
        }
    }

    function makeUploadZone(input, label) {
        if (!input || input.dataset.staffhubUploadReady) return;
        input.dataset.staffhubUploadReady = "1";

        const parent = input.parentElement;
        if (!parent) return;

        const zone = document.createElement("label");
        zone.className = "staffhub-upload-zone";
        zone.innerHTML = `<strong>${esc(label || "Upload files")}</strong><span>Click to browse or drag files here</span>`;

        parent.insertBefore(zone, input);
        zone.appendChild(input);
        input.style.display = "none";

        const previews = document.createElement("div");
        previews.className = "staffhub-upload-previews";
        parent.insertBefore(previews, zone.nextSibling);

        const render = files => {
            previews.innerHTML = "";
            [...files].forEach(file => {
                const card = document.createElement("div");
                card.className = "staffhub-upload-preview";
                if (file.type.startsWith("image/")) {
                    const img = document.createElement("img");
                    img.src = URL.createObjectURL(file);
                    img.alt = file.name;
                    card.appendChild(img);
                }
                const name = document.createElement("span");
                name.textContent = file.name;
                card.appendChild(name);
                previews.appendChild(card);
            });
        };

        input.addEventListener("change", () => render(input.files));

        ["dragenter","dragover"].forEach(eventName => zone.addEventListener(eventName, e => {
            e.preventDefault();
            zone.classList.add("dragover");
        }));

        ["dragleave","drop"].forEach(eventName => zone.addEventListener(eventName, e => {
            e.preventDefault();
            zone.classList.remove("dragover");
        }));

        zone.addEventListener("drop", e => {
            const files = e.dataTransfer.files;
            try {
                const dt = new DataTransfer();
                [...files].forEach(file => dt.items.add(file));
                input.files = dt.files;
            } catch {}
            render(files);
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    }

    function enhanceUploadInputs() {
        document.querySelectorAll('input[type="file"]').forEach(input => {
            makeUploadZone(input, input.accept?.includes("image") ? "Add images" : "Add attachments");
        });
    }

    function installDocumentEditorFix() {
        if (typeof window.openDocumentEditor !== "function" || window.__staffhubDocumentEditorFixed) return;
        window.__staffhubDocumentEditorFixed = true;

        const originalRender = window.renderDocumentEditor;

        window.openDocumentEditor = async function (pageName) {
            if (typeof window.pagePermission === "function" && !pagePermission(pageName, "edit")) return;

            const editorId = pageName === "promosDemos" ? "promos-demos-editor" : `${pageName}-editor`;
            const editor = el(editorId);
            if (!editor) return;

            editor.hidden = false;
            editor.innerHTML = `<div class="editor-panel"><div class="section-label">LOADING EDITOR</div><h2>Loading...</h2><p>Fetching current content.</p></div>`;

            try {
                const data = await window.api(`/api/staffhub/${pageName}`);
                originalRender(pageName, data.page);
                enhanceUploadInputs();
                editor.scrollIntoView({ behavior: "smooth", block: "start" });
            } catch (error) {
                editor.innerHTML = `<div class="editor-panel"><div class="staffhub-fix-error"><strong>Could not load editor</strong><br>${esc(error.message)}</div></div>`;
            }
        };
    }

    function installCommandEditorFix() {
        if (typeof window.openCommandEditor !== "function" || window.__staffhubCommandEditorFixed) return;
        window.__staffhubCommandEditorFixed = true;

        const originalRender = window.renderCommandEditor;

        window.openCommandEditor = async function () {
            const editor = el("command-editor");
            if (!editor) return;

            editor.hidden = false;
            editor.innerHTML = `<div class="editor-panel"><div class="section-label">COMMAND EDITOR</div><h2>Loading commands...</h2></div>`;

            try {
                await window.loadCommands();
                try { await window.loadCommandRoles(); } catch (roleError) { console.warn("Role list unavailable", roleError); }
                originalRender();
                editor.scrollIntoView({ behavior: "smooth", block: "start" });
            } catch (error) {
                editor.innerHTML = `<div class="editor-panel"><div class="staffhub-fix-error"><strong>Could not load command editor</strong><br>${esc(error.message)}</div></div>`;
            }
        };
    }

    function installPromosPermissions() {
        if (document.body.dataset.page !== "promosDemos") return;

        const shell = document.querySelector(".content-shell");
        if (!shell || el("promos-demos-permissions")) return;

        const section = document.createElement("section");
        section.id = "promos-demos-permissions";
        section.className = "editor staffhub-permissions-panel";
        section.hidden = true;
        section.innerHTML = `
            <div class="editor-panel">
                <div class="editor-header">
                    <div>
                        <div class="section-label">PAGE PERMISSIONS</div>
                        <h2>Promos &amp; Demos Access</h2>
                        <p>Control who can view and manage the staff activity log.</p>
                    </div>
                    <button class="btn btn-secondary" type="button" id="close-promos-permissions">CLOSE</button>
                </div>
                <div id="promos-demos-permissions-content"></div>
            </div>`;

        shell.parentElement.insertBefore(section, shell.nextSibling);

        const header = shell.querySelector(".content-shell-header");
        if (header && !el("promos-demos-permissions-button")) {
            const button = document.createElement("button");
            button.id = "promos-demos-permissions-button";
            button.className = "icon-button";
            button.type = "button";
            button.title = "Edit Promos & Demos Permissions";
            button.textContent = "⚙";
            button.hidden = true;
            button.onclick = () => window.openPagePermissions("promosDemos");
            header.appendChild(button);
        }

        el("close-promos-permissions").onclick = () => section.hidden = true;

        window.api("/api/staffhub/me").then(data => {
            if (data?.founder) {
                const button = el("promos-demos-permissions-button");
                if (button) button.hidden = false;
            }
        }).catch(() => {});
    }

    function patchPermissionsForPromos() {
        if (typeof window.openPagePermissions !== "function" || window.__staffhubPermissionsFixed) return;
        window.__staffhubPermissionsFixed = true;

        const original = window.openPagePermissions;

        window.openPagePermissions = async function (pageName) {
            if (pageName === "promosDemos") {
                const section = el("promos-demos-permissions");
                if (!section) return;

                section.hidden = false;

                try {
                    const data = await window.api("/api/staffhub/permissions");
                    const roles = await window.loadPermissionRoles();

                    window.renderPermissionsEditor(
                        "promos-demos-permissions-content",
                        "promosDemos",
                        data.permissions,
                        roles
                    );

                    section.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                } catch (error) {
                    el("promos-demos-permissions-content").innerHTML =
                        `<div class="staffhub-fix-error">${esc(error.message)}</div>`;
                }

                return;
            }

            return original(pageName);
        };
    }

    function installAnnouncementEditorFix() {
        if (typeof window.openAnnouncementsEditor !== "function" || window.__staffhubAnnouncementEditorFixed) return;
        window.__staffhubAnnouncementEditorFixed = true;

        window.openAnnouncementsEditor = function () {
            const editor = el("announcements-editor");
            if (!editor) return;

            editor.hidden = false;
            editor.innerHTML = `
                <div class="editor-panel">
                    <div class="editor-header">
                        <div>
                            <div class="section-label">ANNOUNCEMENT EDITOR</div>
                            <h2>Create Announcement</h2>
                            <p>Publish a clear internal announcement for Xotic staff.</p>
                        </div>
                        <button class="btn btn-secondary" type="button" onclick="closeAnnouncementsEditor()">CLOSE</button>
                    </div>

                    <div class="form-grid">
                        <div class="form-full">
                            <label for="announcement-title">TITLE</label>
                            <input id="announcement-title" type="text" placeholder="Announcement title">
                        </div>

                        <div class="form-full">
                            <label for="announcement-content">CONTENT</label>
                            <textarea id="announcement-content" placeholder="Write your announcement..."></textarea>
                            <small class="editor-help">Supports **bold**, *italic*, ~~strikethrough~~, __underline__, \`code\`, and code blocks.</small>
                        </div>

                        <div class="form-full">
                            <label>ATTACHMENTS</label>
                            <input id="announcement-files" type="file" accept="image/*" multiple onchange="previewAnnouncementFiles(this.files)">
                            <div id="announcement-images-preview" class="image-preview"></div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button id="announcement-publish-button" class="btn" type="button" onclick="createAnnouncement()">PUBLISH ANNOUNCEMENT</button>
                    </div>
                </div>
            `;

            enhanceUploadInputs();
            editor.scrollIntoView({ behavior: "smooth", block: "start" });
        };
    }

    function improveHome() {
        if (document.body.dataset.page !== "home") return;

        const grid = el("home-grid");
        if (grid) grid.classList.add("staffhub-home-grid");

        const hero = document.querySelector(".hero-panel");
        if (hero) hero.classList.add("staffhub-home-hero");
    }

    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
            installUserMirror();
            installDocumentEditorFix();
            installCommandEditorFix();
            installPromosPermissions();
            patchPermissionsForPromos();
            installAnnouncementEditorFix();
            improveHome();
            enhanceUploadInputs();
        }, 0);
    });
})();
