(function () {
        const CARDS_BASE = "./cards/";
        const YOUTUBE_EMBED =
          "https://www.youtube-nocookie.com/embed/VIDEO_ID?autoplay=1&controls=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&fs=0&disablekb=1";
        const GAME_CV_URL =
          "https://itch.io/embed-upload/17801082?color=333333";

        const personalGamesGrid = document.getElementById(
          "personal-games-grid"
        );
        const softwareRndGrid = document.getElementById("software-rnd-grid");
        const artVisualGrid = document.getElementById("art-visual-grid");
        const proWorkGrid = document.getElementById("pro-work-grid");
        const workOverlay = document.getElementById("work-overlay");
        const workDetail = document.getElementById("work-detail");

        const youtubeModal = document.getElementById("youtube-modal");
        const youtubePanel = document.getElementById("youtube-modal-panel");
        const youtubeFrame = document.getElementById("youtube-modal-frame");
        const youtubeIframe = document.getElementById("youtube-modal-iframe");
        const youtubeClose = document.getElementById("youtube-modal-close");

        const CATEGORY_SECTIONS = [
          {
            grid: personalGamesGrid,
            backLabel: "&larr; Back to Personal Games",
          },
          {
            grid: softwareRndGrid,
            backLabel:
              "&larr; Back to Software Projects &amp; R&amp;D",
          },
          {
            grid: artVisualGrid,
            backLabel: "&larr; Back to Art &amp; Visual Work",
          },
        ];

        const projectRegistry = {}; // id -> { project, backLabel }
        let activeProjectId = null;
        let activeSubId = null;

        function backButton(label, action) {
          return `<button type="button" class="btn btn--back" data-back="${action}">${label}</button>`;
        }

        function resolveFragmentUrls(html) {
          const siteBase = new URL("./", window.location.href);
          return html.replace(/(src|href)="(\.\/[^"]+)"/g, (_, attr, relPath) => {
            const resolved = new URL(relPath, siteBase).href;
            return `${attr}="${resolved}"`;
          });
        }

        async function loadCardFragment(path) {
          const response = await fetch(CARDS_BASE + path, { cache: "no-store" });
          if (!response.ok) {
            throw new Error("Could not load card: " + path);
          }

          return response.text();
        }

        async function showDetailFromFile(path, backLabel, backAction) {
          workDetail.innerHTML =
            backButton(backLabel, backAction) +
            '<p class="work-detail__loading">Loading…</p>';
          showDetailPanel();

          try {
            const html = resolveFragmentUrls(await loadCardFragment(path));
            workDetail.innerHTML = backButton(backLabel, backAction) + html;
            const title = workDetail.querySelector(".work-detail__title");
            if (title) workDetail.setAttribute("aria-labelledby", title.id || "");
            bindYoutubeButtons(workDetail);
            bindGalleries(workDetail);
            bindPaintingGallery(workDetail);
          } catch (error) {
            workDetail.innerHTML =
              backButton(backLabel, backAction) +
              '<p class="work-detail__error">Could not load this project. Check that the file exists in the cards folder.</p>';
            console.error(error);
          }
        }

        function openYoutubeModal(title, videoId, layout) {
          const isVertical = layout === "vertical";
          youtubePanel.classList.toggle("video-modal__panel--vertical", isVertical);
          youtubePanel.classList.toggle("video-modal__panel--wide", layout === "wide");
          youtubeFrame.classList.toggle("video-modal__frame--wide", layout === "wide");
          youtubeFrame.classList.toggle(
            "video-modal__frame--vertical",
            isVertical
          );
          youtubeModal.setAttribute("aria-label", title || "Video player");
          youtubeIframe.title = title || "YouTube video player";
          youtubeIframe.src = YOUTUBE_EMBED.replace("VIDEO_ID", videoId);
          youtubeModal.showModal();
        }

        function closeYoutubeModal() {
          youtubeIframe.src = "";
          if (youtubeModal.open) youtubeModal.close();
        }

        function bindYoutubeButtons(root) {
          root.querySelectorAll("[data-youtube]").forEach((btn) => {
            btn.addEventListener("click", () => {
              openYoutubeModal(
                btn.dataset.youtubeTitle || "Video",
                btn.dataset.youtube,
                btn.dataset.youtubeLayout || "wide"
              );
            });
          });
        }

        const paintingLightbox = document.getElementById("painting-lightbox");
        const paintingLightboxImg = document.getElementById("painting-lightbox-img");
        const paintingLightboxCaption = document.getElementById(
          "painting-lightbox-caption"
        );
        const paintingLightboxClose = document.getElementById(
          "painting-lightbox-close"
        );

        function openPaintingLightbox(src, title) {
          paintingLightboxImg.src = src;
          paintingLightboxImg.alt = title;
          paintingLightboxCaption.textContent = title;
          paintingLightbox.hidden = false;
          document.body.classList.add("painting-lightbox-open");
        }

        function closePaintingLightbox() {
          paintingLightbox.hidden = true;
          paintingLightboxImg.removeAttribute("src");
          document.body.classList.remove("painting-lightbox-open");
        }

        function bindPaintingGallery(root) {
          const gallery = root.querySelector(".painting-gallery");
          if (!gallery) return;

          gallery.querySelectorAll(".painting-gallery__item").forEach((item) => {
            item.setAttribute("tabindex", "0");
            item.setAttribute("role", "button");
            item.setAttribute(
              "aria-label",
              `View ${item.querySelector(".painting-gallery__label")?.textContent || "painting"}`
            );

            item.addEventListener("click", (e) => {
              e.stopPropagation();
              const img = item.querySelector("img");
              const label = item.querySelector(".painting-gallery__label");
              if (!img) return;
              openPaintingLightbox(
                img.currentSrc || img.src,
                label?.textContent || img.alt || "Painting"
              );
            });

            item.addEventListener("keydown", (e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              item.click();
            });
          });
        }

        paintingLightboxClose.addEventListener("click", (e) => {
          e.stopPropagation();
          closePaintingLightbox();
        });
        paintingLightbox.addEventListener("click", (e) => {
          if (e.target === paintingLightbox) closePaintingLightbox();
        });

        const videoLightbox = document.getElementById("video-lightbox");
        const videoLightboxVideo = document.getElementById("video-lightbox-video");
        const videoLightboxCaption = document.getElementById("video-lightbox-caption");
        const videoLightboxClose = document.getElementById("video-lightbox-close");
        const videoLightboxPrev = document.getElementById("video-lightbox-prev");
        const videoLightboxNext = document.getElementById("video-lightbox-next");
        const videoLightboxMute = document.getElementById("video-lightbox-mute");
        const videoLightboxCounter = document.getElementById("video-lightbox-counter");
        let videoLightboxSession = null;

        function getSlideTitle(slide, getSlideVideo) {
          const caption = slide.querySelector(".media-gallery__caption");
          const video = getSlideVideo(slide);
          return (
            caption?.textContent?.trim() ||
            video?.getAttribute("aria-label") ||
            "VFX"
          );
        }

        function updateLightboxMuteUi() {
          if (!videoLightboxSession) return;
          const isMuted = videoLightboxSession.isMuted;
          videoLightboxMute.classList.toggle("is-muted", isMuted);
          videoLightboxMute.setAttribute("aria-label", isMuted ? "Unmute" : "Mute");
          videoLightboxMute.setAttribute("aria-pressed", String(isMuted));
        }

        function updateLightboxSlide() {
          const session = videoLightboxSession;
          if (!session) return;

          const slide = session.slides[session.index];
          const video = session.getSlideVideo(slide);
          if (!video) return;

          videoLightboxVideo.src = video.currentSrc || video.src;
          videoLightboxVideo.muted = session.isMuted;
          videoLightboxCaption.textContent = getSlideTitle(slide, session.getSlideVideo);
          videoLightboxCounter.textContent = `${session.index + 1} / ${session.slides.length}`;

          const hasMultiple = session.slides.length > 1;
          videoLightboxPrev.hidden = !hasMultiple;
          videoLightboxNext.hidden = !hasMultiple;

          updateLightboxMuteUi();
          videoLightboxVideo.play().catch(() => {});
        }

        function openVideoLightbox(session) {
          videoLightboxSession = session;
          session.videos.forEach((video) => video.pause());
          session.setGalleryIndex(session.index, { playMedia: false });
          videoLightbox.hidden = false;
          document.body.classList.add("video-lightbox-open");
          updateLightboxSlide();
        }

        function closeVideoLightbox() {
          const session = videoLightboxSession;
          videoLightboxVideo.pause();
          videoLightboxVideo.removeAttribute("src");
          videoLightboxVideo.load();
          videoLightbox.hidden = true;
          document.body.classList.remove("video-lightbox-open");
          videoLightboxSession = null;

          if (session) {
            const video = session.getSlideVideo(session.slides[session.index]);
            session.tryPlayVideo(video);
          }
        }

        function lightboxShowSlide(nextIndex) {
          if (!videoLightboxSession) return;
          const session = videoLightboxSession;
          session.index =
            (nextIndex + session.slides.length) % session.slides.length;
          session.setGalleryIndex(session.index, { playMedia: false });
          updateLightboxSlide();
        }

        videoLightboxClose.addEventListener("click", (e) => {
          e.stopPropagation();
          closeVideoLightbox();
        });
        videoLightbox.addEventListener("click", (e) => {
          if (e.target === videoLightbox) closeVideoLightbox();
        });
        videoLightboxPrev.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!videoLightboxSession) return;
          lightboxShowSlide(videoLightboxSession.index - 1);
        });
        videoLightboxNext.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!videoLightboxSession) return;
          lightboxShowSlide(videoLightboxSession.index + 1);
        });
        videoLightboxMute.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!videoLightboxSession) return;
          const session = videoLightboxSession;
          session.isMuted = !session.isMuted;
          videoLightboxVideo.muted = session.isMuted;
          session.videos.forEach((video) => {
            video.muted = session.isMuted;
          });
          session.updateMuteUi();
          updateLightboxMuteUi();
          videoLightboxVideo.play().catch(() => {});
        });

        function bindGalleries(root) {
          root.querySelectorAll("[data-gallery]").forEach((gallery) => {
            const slides = [...gallery.querySelectorAll(".media-gallery__slide")];
            const prevBtn = gallery.querySelector(".media-gallery__btn--prev");
            const nextBtn = gallery.querySelector(".media-gallery__btn--next");
            const counter = gallery.querySelector("[data-gallery-counter]");
            if (!slides.length) return;

            let index = slides.findIndex((slide) =>
              slide.classList.contains("is-active")
            );
            if (index < 0) index = 0;

            function getSlideVideo(slide) {
              return slide.tagName === "VIDEO"
                ? slide
                : slide.querySelector("video");
            }

            const videos = slides.map(getSlideVideo).filter(Boolean);
            let isMuted = true;

            videos.forEach((video) => {
              video.muted = true;
            });

            let muteBtn = gallery.querySelector(".media-gallery__btn--mute");
            if (videos.length && !muteBtn) {
              muteBtn = document.createElement("button");
              muteBtn.type = "button";
              muteBtn.className =
                "media-gallery__btn media-gallery__btn--mute is-muted";
              muteBtn.setAttribute("aria-label", "Unmute");
              muteBtn.setAttribute("aria-pressed", "true");
              muteBtn.innerHTML =
                '<span class="media-gallery__mute-icon media-gallery__mute-icon--off" aria-hidden="true">&#128263;</span>' +
                '<span class="media-gallery__mute-icon media-gallery__mute-icon--on" aria-hidden="true">&#128266;</span>';
              gallery.appendChild(muteBtn);
            }

            function updateMuteUi() {
              if (!muteBtn) return;
              muteBtn.classList.toggle("is-muted", isMuted);
              muteBtn.setAttribute("aria-label", isMuted ? "Unmute" : "Mute");
              muteBtn.setAttribute("aria-pressed", String(isMuted));
            }

            function tryPlayVideo(video) {
              if (!video) return;
              video.muted = isMuted;
              if (video.readyState < 1) {
                video.load();
              }
              video.play().catch(() => {});
            }

            function syncSlideMedia(slide, isActive) {
              const video = getSlideVideo(slide);
              if (!video) return;
              if (isActive) {
                tryPlayVideo(video);
              } else {
                video.pause();
                video.currentTime = 0;
              }
            }

            function setGalleryIndex(nextIndex, { playMedia = true } = {}) {
              index = (nextIndex + slides.length) % slides.length;
              slides.forEach((slide, i) => {
                const isActive = i === index;
                slide.classList.toggle("is-active", isActive);
                if (playMedia) {
                  syncSlideMedia(slide, isActive);
                } else if (!isActive) {
                  const video = getSlideVideo(slide);
                  if (video) {
                    video.pause();
                    video.currentTime = 0;
                  }
                }
              });
              if (counter) {
                counter.textContent = `${index + 1} / ${slides.length}`;
              }
            }

            function showSlide(nextIndex) {
              setGalleryIndex(nextIndex, { playMedia: true });
            }

            showSlide(index);
            updateMuteUi();

            const viewport = gallery.querySelector(".media-gallery__viewport");
            if (videos.length && viewport) {
              viewport.classList.add("media-gallery__viewport--expandable");
              viewport.addEventListener("click", () => {
                openVideoLightbox({
                  slides,
                  videos,
                  index,
                  isMuted,
                  getSlideVideo,
                  setGalleryIndex,
                  tryPlayVideo,
                  updateMuteUi,
                });
              });
            }

            muteBtn?.addEventListener("click", (e) => {
              e.stopPropagation();
              isMuted = !isMuted;
              videos.forEach((video) => {
                video.muted = isMuted;
              });
              updateMuteUi();
              if (videoLightboxSession && videoLightboxSession.videos === videos) {
                videoLightboxSession.isMuted = isMuted;
                videoLightboxVideo.muted = isMuted;
                updateLightboxMuteUi();
              }
              const active = getSlideVideo(slides[index]);
              if (active && !active.paused) active.play().catch(() => {});
            });

            prevBtn?.addEventListener("click", (e) => {
              e.stopPropagation();
              showSlide(index - 1);
            });
            nextBtn?.addEventListener("click", (e) => {
              e.stopPropagation();
              showSlide(index + 1);
            });
          });
        }

        function showGrid() {
          activeProjectId = null;
          activeSubId = null;
          closeVideoLightbox();
          workOverlay.hidden = true;
          workDetail.innerHTML = "";
          workDetail.classList.remove("work-detail--game-cv");
          workDetail.removeAttribute("aria-labelledby");
          workDetail.removeAttribute("aria-label");
          document.body.classList.remove("work-overlay-open");
        }

        function openGameCv() {
          activeProjectId = null;
          activeSubId = null;
          workDetail.classList.add("work-detail--game-cv");
          workDetail.innerHTML =
            backButton("&larr; Back", "grid") +
            `<div class="game-cv-embed">
              <iframe
                class="game-cv-embed__iframe"
                src="${GAME_CV_URL}"
                title="My CV is a Game!"
                allow="fullscreen; gamepad; autoplay"
                allowfullscreen
              ></iframe>
            </div>`;
          workDetail.setAttribute("aria-label", "Game CV");
          showDetailPanel();
        }

        function showDetailPanel() {
          workOverlay.hidden = false;
          document.body.classList.add("work-overlay-open");
        }

        function openProjectDetail(detailPath, backLabel) {
          activeProjectId = null;
          activeSubId = null;
          showDetailFromFile(detailPath, backLabel, "grid");
        }

        function openProject(id) {
          const entry = projectRegistry[id];
          const project = entry?.project;
          if (!project || !entry) return;

          activeProjectId = id;
          activeSubId = null;
          showDetailFromFile(
            project.detail,
            entry.backLabel,
            "grid"
          );
        }

        function openSubProject(detailPath) {
          activeSubId = detailPath;
          showDetailFromFile(detailPath, "&larr; Back to archive", "archive");
        }

        async function openArchive() {
          const entry = projectRegistry[activeProjectId];
          const project = entry?.project;
          if (!project || !entry) return;
          activeSubId = null;
          await showDetailFromFile(
            project.detail,
            entry.backLabel,
            "grid"
          );
        }

        function handleCategoryCardClick(e) {
          const card = e.target.closest(
            "[data-project-id][data-detail]"
          );
          if (!card) return;
          openProject(card.dataset.projectId);
        }

        CATEGORY_SECTIONS.forEach((section) => {
          section.grid.addEventListener("click", handleCategoryCardClick);
        });

        proWorkGrid.addEventListener("click", (e) => {
          const card = e.target.closest("[data-detail]");
          if (!card) return;
          openProjectDetail(card.dataset.detail, "&larr; Back");
        });

        workOverlay.addEventListener("click", (e) => {
          if (e.target === workOverlay) showGrid();
        });

        workDetail.addEventListener("click", (e) => {
          const back = e.target.closest("[data-back]");
          if (back) {
            if (back.dataset.back === "archive") {
              openArchive();
              return;
            }
            showGrid();
            return;
          }

          const subCard = e.target.closest("[data-sub-id]");
          if (subCard && subCard.dataset.detail) {
            openSubProject(subCard.dataset.detail);
          }
        });

        document.addEventListener("keydown", (e) => {
          if (e.key !== "Escape") return;
          if (!videoLightbox.hidden) {
            closeVideoLightbox();
            return;
          }
          if (!paintingLightbox.hidden) {
            closePaintingLightbox();
            return;
          }
          if (youtubeModal.open) {
            closeYoutubeModal();
            return;
          }
          if (!workOverlay.hidden) showGrid();
        });

        // Static cards already contain the fragment paths; no JSON fetch or rerender.
        CATEGORY_SECTIONS.forEach((section) => {
          section.grid.querySelectorAll("[data-project-id][data-detail]").forEach((card) => {
            projectRegistry[card.dataset.projectId] = {
              project: { detail: card.dataset.detail },
              backLabel: section.backLabel,
            };
          });
        });

        document.getElementById("video-cv-open").addEventListener("click", () => {
          openYoutubeModal("Intro Video", "JJZnswDj0YA", "vertical");
        });

        youtubeClose.addEventListener("click", closeYoutubeModal);
        youtubeModal.addEventListener("click", (e) => {
          if (e.target === youtubeModal) closeYoutubeModal();
        });
        youtubeModal.addEventListener("cancel", (e) => {
          e.preventDefault();
          closeYoutubeModal();
        });
      })();
