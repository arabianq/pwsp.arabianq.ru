/**
 * PipeWire Soundpad (PWSP) Client JavaScript
 * Handles:
 *  - Responsive navbar scroll effects
 *  - Mobile menu toggling
 *  - Installation guide tab switching
 *  - Code copy-to-clipboard functionality
 *  - Dynamic fetching of latest release from GitHub API
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavbarScroll();
    initMobileMenu();
    initInstallTabs();
    initCopyButtons();
    fetchLatestRelease();
});

/**
 * Adds a background and blur to the header navbar when scrolling down
 */
function initNavbarScroll() {
    const header = document.getElementById('main-header');
    let ticking = false;
    
    const handleScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 30) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    };
    
    // Check initial load scroll position
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * Handles the mobile menu open/close behavior
 */
function initMobileMenu() {
    const header = document.getElementById('main-header');
    const toggleBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelectorAll('.nav-link');
    
    toggleBtn.addEventListener('click', () => {
        header.classList.toggle('mobile-active');
        
        // Prevent body scrolling when menu is open
        if (header.classList.contains('mobile-active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });
    
    // Close menu when a navigation link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (header.classList.contains('mobile-active')) {
                header.classList.remove('mobile-active');
                document.body.style.overflow = '';
            }
        });
    });
}

/**
 * Switches between different installation distribution tabs
 */
function initInstallTabs() {
    const tabContainer = document.getElementById('install-tabs');
    if (!tabContainer) return;
    
    const tabButtons = tabContainer.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('aria-controls');
            const targetPanel = document.getElementById(targetId);
            
            if (!targetPanel) return;
            
            // Deactivate all buttons and panels
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            tabPanels.forEach(panel => {
                panel.classList.remove('active');
            });
            
            // Activate current button and panel
            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
            targetPanel.classList.add('active');
        });
    });
}

/**
 * Enables copy command functionality for code segments
 */
function initCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    copyButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetSelector = btn.getAttribute('data-clipboard-target');
            const codeEl = document.querySelector(targetSelector);
            if (!codeEl) return;
            
            const codeText = codeEl.textContent;
            
            try {
                await navigator.clipboard.writeText(codeText);
                
                // Show copied success state
                btn.classList.add('copied');
                const btnText = btn.querySelector('span');
                const originalText = btnText.textContent;
                btnText.textContent = 'Copied!';
                
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btnText.textContent = originalText;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy to clipboard', err);
            }
        });
    });
}

/**
 * Fetches latest release details from GitHub API to populate downloads dynamically
 */
async function fetchLatestRelease() {
    const repoUrl = 'https://api.github.com/repos/arabianq/pipewire-soundpad/releases/latest';
    const fallbackVersion = 'v1.12.0';
    
    const badgeEl = document.getElementById('latest-version-badge');
    const downloadVTag = document.getElementById('downloads-v-tag');
    const downloadVDate = document.getElementById('downloads-v-date');
    const downloadsContainer = document.getElementById('downloads-container');
    
    try {
        const response = await fetch(repoUrl);
        if (!response.ok) {
            throw new Error(`GitHub API returned status ${response.status}`);
        }
        
        const data = await response.json();
        const version = data.tag_name;
        const publishDate = new Date(data.published_at);
        
        // Format publishing date in English
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = publishDate.toLocaleDateString('en-US', dateOptions);
        
        // Update header/hero badges
        if (badgeEl) {
            badgeEl.textContent = `Latest Release: ${version}`;
        }
        if (downloadVTag) {
            downloadVTag.textContent = version;
        }
        if (downloadVDate) {
            downloadVDate.textContent = `released on ${formattedDate}`;
        }
        
        // Process release assets
        let debAssetX64 = null;
        let debAssetArm64 = null;
        let zipAssetX64 = null;
        let zipAssetArm64 = null;
        
        data.assets.forEach(asset => {
            if (asset.name.endsWith('.deb')) {
                if (asset.name.includes('arm64')) {
                    debAssetArm64 = asset;
                } else {
                    debAssetX64 = asset;
                }
            } else if (asset.name.endsWith('.zip') && !asset.name.includes('source')) {
                // Ignore general source zips, lookup for built binary
                if (asset.name.includes('arm64')) {
                    zipAssetArm64 = asset;
                } else {
                    zipAssetX64 = asset;
                }
            }
        });
        
        // Build downloads array
        const downloads = [];
        
        if (debAssetX64) {
            const sizeMB = (debAssetX64.size / (1024 * 1024)).toFixed(1);
            downloads.push({
                icon: '🐧',
                name: 'Debian / Ubuntu Package',
                format: 'DEB (64-bit)',
                url: debAssetX64.browser_download_url,
                info: `Size: ~${sizeMB} MB • Downloads: ${debAssetX64.download_count}`
            });
        } else {
            // Fallback deb if not in assets but we expect it
            downloads.push({
                icon: '🐧',
                name: 'Debian / Ubuntu Package',
                format: 'DEB (64-bit)',
                url: `https://github.com/arabianq/pipewire-soundpad/releases/download/${version}/pwsp-gui_${version.replace('v', '')}-1_amd64.deb`,
                info: `For Intel/AMD 64-bit systems`
            });
        }

        if (debAssetArm64) {
            const sizeMB = (debAssetArm64.size / (1024 * 1024)).toFixed(1);
            downloads.push({
                icon: '🐧',
                name: 'Debian / Ubuntu Package (ARM)',
                format: 'DEB (ARM64)',
                url: debAssetArm64.browser_download_url,
                info: `Size: ~${sizeMB} MB • Downloads: ${debAssetArm64.download_count}`
            });
        } else {
            downloads.push({
                icon: '🐧',
                name: 'Debian / Ubuntu Package (ARM)',
                format: 'DEB (ARM64)',
                url: `https://github.com/arabianq/pipewire-soundpad/releases/download/${version}/pwsp-gui_${version.replace('v', '')}-1_arm64.deb`,
                info: `For ARM 64-bit systems`
            });
        }
        
        if (zipAssetX64) {
            const sizeMB = (zipAssetX64.size / (1024 * 1024)).toFixed(1);
            downloads.push({
                icon: '📦',
                name: 'Standalone Binaries',
                format: 'ZIP (64-bit)',
                url: zipAssetX64.browser_download_url,
                info: `Size: ~${sizeMB} MB • Downloads: ${zipAssetX64.download_count}`
            });
        } else {
            downloads.push({
                icon: '📦',
                name: 'Standalone Binaries',
                format: 'ZIP (64-bit)',
                url: `https://github.com/arabianq/pipewire-soundpad/releases/download/${version}/pwsp-${version}-linux-x64.zip`,
                info: `Pre-compiled x64 binaries`
            });
        }

        if (zipAssetArm64) {
            const sizeMB = (zipAssetArm64.size / (1024 * 1024)).toFixed(1);
            downloads.push({
                icon: '📦',
                name: 'Standalone Binaries (ARM)',
                format: 'ZIP (ARM64)',
                url: zipAssetArm64.browser_download_url,
                info: `Size: ~${sizeMB} MB • Downloads: ${zipAssetArm64.download_count}`
            });
        } else {
            downloads.push({
                icon: '📦',
                name: 'Standalone Binaries (ARM)',
                format: 'ZIP (ARM64)',
                url: `https://github.com/arabianq/pipewire-soundpad/releases/download/${version}/pwsp-${version}-linux-arm64.zip`,
                info: `Pre-compiled ARM64 binaries`
            });
        }
        
        // Add source downloads
        downloads.push({
            icon: '🗜️',
            name: 'Source Code (tar.gz)',
            format: 'TAR.GZ',
            url: `https://github.com/arabianq/pipewire-soundpad/archive/refs/tags/${version}.tar.gz`,
            info: 'For compiling manually'
        });
        
        downloads.push({
            icon: '🗂️',
            name: 'Source Code (zip)',
            format: 'ZIP',
            url: `https://github.com/arabianq/pipewire-soundpad/archive/refs/tags/${version}.zip`,
            info: 'For compiling manually'
        });
        
        // Render downloads
        renderDownloads(downloads, downloadsContainer);
        
    } catch (err) {
        console.warn('Could not fetch latest release from GitHub API, using fallback UI:', err);
        
        // Setup fallback UI
        if (badgeEl) {
            badgeEl.textContent = 'Release: GitHub Version';
        }
        if (downloadVTag) {
            downloadVTag.textContent = fallbackVersion;
        }
        if (downloadVDate) {
            downloadVDate.textContent = 'latest release';
        }
        
        const fallbackDownloads = [
            {
                icon: '🐧',
                name: 'Debian / Ubuntu Package',
                format: 'DEB (64-bit)',
                url: `https://github.com/arabianq/pipewire-soundpad/releases/download/${fallbackVersion}/pwsp-gui_${fallbackVersion.replace('v', '')}-1_amd64.deb`,
                info: 'Install on Ubuntu/Debian/Mint'
            },
            {
                icon: '🐧',
                name: 'Debian / Ubuntu Package (ARM)',
                format: 'DEB (ARM64)',
                url: `https://github.com/arabianq/pipewire-soundpad/releases/download/${fallbackVersion}/pwsp-gui_${fallbackVersion.replace('v', '')}-1_arm64.deb`,
                info: 'Install on ARM-based Ubuntu/Debian'
            },
            {
                icon: '📦',
                name: 'Standalone Binaries',
                format: 'ZIP (64-bit)',
                url: `https://github.com/arabianq/pipewire-soundpad/releases/download/${fallbackVersion}/pwsp-${fallbackVersion}-linux-x64.zip`,
                info: 'For other Linux distributions'
            },
            {
                icon: '📦',
                name: 'Standalone Binaries (ARM)',
                format: 'ZIP (ARM64)',
                url: `https://github.com/arabianq/pipewire-soundpad/releases/download/${fallbackVersion}/pwsp-${fallbackVersion}-linux-arm64.zip`,
                info: 'For ARM-based Linux distributions'
            },
            {
                icon: '🗜️',
                name: 'Source Code (tar.gz)',
                format: 'TAR.GZ',
                url: `https://github.com/arabianq/pipewire-soundpad/archive/refs/tags/${fallbackVersion}.tar.gz`,
                info: 'Compile from source'
            },
            {
                icon: '🗂️',
                name: 'Source Code (zip)',
                format: 'ZIP',
                url: `https://github.com/arabianq/pipewire-soundpad/archive/refs/tags/${fallbackVersion}.zip`,
                info: 'Compile from source'
            }
        ];
        
        renderDownloads(fallbackDownloads, downloadsContainer);
    }
}

/**
 * Helper function to render download cards into the DOM
 */
function renderDownloads(downloads, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    downloads.forEach(dl => {
        const card = document.createElement('div');
        card.className = 'download-card';
        
        card.innerHTML = `
            <div class="dl-icon">${dl.icon}</div>
            <h3 class="dl-name">${dl.name}</h3>
            <span class="dl-format">${dl.format}</span>
            <p class="feature-text" style="font-size: 0.85rem; margin-bottom: 1.5rem;">${dl.info}</p>
            <a href="${dl.url}" class="btn btn-primary dl-btn" download>Download</a>
        `;
        
        container.appendChild(card);
    });
}
