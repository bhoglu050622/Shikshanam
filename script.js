document.addEventListener('DOMContentLoaded', () => {
    const dbKey = 'shikshanamUserData';

    // --- DATA MANAGEMENT ---
    const createDefaultData = () => ({
        user: { name: null, avatar: 'The Seeker' },
        gamification: { points: 0, badges: [] },
        quizProgress: { guna: { status: 'not-started' }, shiva: { status: 'not-started' } }
    });

    const loadData = () => JSON.parse(localStorage.getItem(dbKey)) || createDefaultData();
    const saveData = (data) => localStorage.setItem(dbKey, JSON.stringify(data));

    // --- COMPONENT LOADING ---
    const loadComponent = async (containerId, filePath) => {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`Failed to load ${filePath}`);
            const html = await response.text();
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = html;
                // This part is for re-executing scripts if the loaded component has them
                Array.from(container.querySelectorAll("script")).forEach(oldScript => {
                    const newScript = document.createElement("script");
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
            }
        } catch (error) { console.error(`Error loading component:`, error); }
    };

    // --- UI RENDERING & NAVIGATION ---
    const renderDashboard = (data) => {
        const dashboardContainer = document.getElementById('dashboard-container');
        dashboardContainer.innerHTML = ''; // Clear previous content
        loadComponent('dashboard-container', 'sections/rishi-dashboard.html').then(() => {
            document.getElementById('user-name').textContent = data.user.name;
            document.getElementById('user-points').textContent = data.gamification.points;
            document.getElementById('user-badges-count').textContent = data.gamification.badges.length;

            const badgeGrid = document.getElementById('badge-grid');
            const allBadges = [
                { id: 'journey_started', icon: 'fa-solid fa-flag', title: 'Journey Started', desc: 'Began your Rishi Mode.' },
                { id: 'guna_profiler', icon: 'fa-solid fa-feather-alt', title: 'Guna Profiler', desc: 'Completed the Guna Profiler.' },
                { id: 'shiva_quiz', icon: 'fa-solid fa-om', title: 'Shiva Consciousness', desc: 'Completed the Shiva Quiz.' }
            ];
            badgeGrid.innerHTML = allBadges.map(badge => {
                const unlocked = data.gamification.badges.includes(badge.id);
                return `<div class="badge-card ${unlocked ? 'unlocked' : 'locked'}"><div class="badge-icon"><i class="${badge.icon}"></i></div><h4>${badge.title}</h4><p>${badge.desc}</p></div>`;
            }).join('');

            const quizGrid = document.getElementById('quiz-grid');
            quizGrid.innerHTML = `
                <div class="quiz-card guna" data-quiz="guna">
                    ${data.quizProgress.guna.status === 'completed' ? '<div class="completed-overlay"><i class="fa-solid fa-check-circle"></i><span>Completed</span></div>' : ''}
                    <div class="quiz-icon"><i class="fa-solid fa-feather-alt"></i></div><h4 class="quiz-title">The Guna Profiler</h4><p class="quiz-description">Uncover the forces shaping your personality.</p><button class="btn-quiz"><span>Begin Profiler</span><i class="fa-solid fa-arrow-right"></i></button>
                </div>
                <div class="quiz-card shiva" data-quiz="shiva">
                    ${data.quizProgress.shiva.status === 'completed' ? '<div class="completed-overlay"><i class="fa-solid fa-check-circle"></i><span>Completed</span></div>' : ''}
                    <div class="quiz-icon"><i class="fa-solid fa-om"></i></div><h4 class="quiz-title">Shiv Consciousness Quiz</h4><p class="quiz-description">Explore your connection to ultimate reality.</p><button class="btn-quiz"><span>Take the Quiz</span><i class="fa-solid fa-arrow-right"></i></button>
                </div>
            `;
            
            const journeyContainer = document.getElementById('journey-path-container');
            if(data.quizProgress.guna.status === 'completed' || data.quizProgress.shiva.status === 'completed'){
                journeyContainer.innerHTML = `<div class="results-summary"><h4>Your Journey Insights</h4><p>You've begun to explore your inner world. Revisit your results or take another quiz to deepen your understanding.</p></div>`;
            } else {
                journeyContainer.innerHTML = `<div class="journey-results-placeholder"><i class="fa-solid fa-lightbulb"></i><p>Complete a quiz to see your personalized recommendations here.</p></div>`;
            }

            initializeDashboardLinks();
        });
    };
    
    const loadHomepageSections = async () => {
        await Promise.all([
            loadComponent('hero-container', 'sections/hero.html'),
            loadComponent('rishi-mode-container', 'sections/rishi-mode.html'),
            loadComponent('masterclasses-container', 'sections/free-masterclasses.html'),
            loadComponent('premium-courses-container', 'sections/premium-courses.html'),
            loadComponent('darshanas-container', 'sections/the-six-darshanas.html'),
            loadComponent('sangha-container', 'sections/join-the-sangha.html'),
            loadComponent('insights-container', 'sections/latest-insights.html'),
            loadComponent('team-container', 'sections/wisdom-keepers.html'),
            loadComponent('contributors-container', 'sections/contributors.html'),
        ]);
        initializeRishiForm();
    };

    const navigateToHomepage = async () => {
        document.body.classList.remove('quiz-active');
        document.getElementById('guna-profiler-container').innerHTML = '';
        document.getElementById('shiva-quiz-container').innerHTML = '';
        document.getElementById('dashboard-container').style.display = 'none';
        
        const homepageContainer = document.getElementById('homepage-sections');
        homepageContainer.style.display = 'block';

        // Only reload homepage content if it's not already there
        if (!homepageContainer.querySelector('#hero-container').innerHTML.trim()) {
            await loadHomepageSections();
        }
        window.scrollTo(0, 0);
    };

    // --- EVENT HANDLERS & INITIALIZATION ---
    const handleQuizCompletion = (quizName) => {
        let data = loadData();
        const badgeId = quizName === 'guna' ? 'guna_profiler' : 'shiva_quiz';
        if (!data.gamification.badges.includes(badgeId)) {
            data.quizProgress[quizName].status = 'completed';
            data.gamification.points += 50;
            data.gamification.badges.push(badgeId);
            saveData(data);
        }
        document.body.classList.remove('quiz-active');
        document.getElementById('guna-profiler-container').innerHTML = '';
        document.getElementById('shiva-quiz-container').innerHTML = '';
        initializeApp();
    };

    const initializeDashboardLinks = () => {
        const launchQuiz = (containerId, filePath, quizName) => {
            document.body.classList.add('quiz-active');
            loadComponent(containerId, filePath).then(() => {
                window.completeQuiz = () => handleQuizCompletion(quizName);
            });
        };
        document.querySelector('.quiz-card[data-quiz="guna"] button')?.addEventListener('click', () => launchQuiz('guna-profiler-container', 'sections/guna-profiler.html', 'guna'));
        document.querySelector('.quiz-card[data-quiz="shiva"] button')?.addEventListener('click', () => launchQuiz('shiva-quiz-container', 'sections/shiv-consciousness-inquiry.html', 'shiva'));
    };
    
    const initializeRishiForm = () => {
        const form = document.querySelector('#rishi-mode .profile-form form');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                let data = loadData();
                data.user.name = document.getElementById('name').value.trim() || 'Seeker';
                if (!data.gamification.badges.includes('journey_started')) {
                    data.gamification.points += 10;
                    data.gamification.badges.push('journey_started');
                }
                saveData(data);
                initializeApp();
            });
        }
    };
    
    const initializeHeaderMenu = () => {
        const headerContainer = document.getElementById('header-container');
        if (!headerContainer) return;

        const logo = headerContainer.querySelector('.logo');
        if (logo) {
            logo.addEventListener('click', (e) => {
                e.preventDefault();
                navigateToHomepage();
            });
        }
        
        const header = headerContainer.querySelector('header');
        window.addEventListener('scroll', () => {
            if (header) {
                header.classList.toggle('scrolled', window.scrollY > 50);
            }
        });

        const dropdownToggles = headerContainer.querySelectorAll('.nav-link-dropdown');
        const megaMenus = headerContainer.querySelectorAll('.mega-menu');
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const menuId = toggle.dataset.menu;
                const targetMenu = headerContainer.querySelector(`.mega-menu[data-menu-content="${menuId}"]`);
                const parentLi = toggle.closest('.nav-item-dropdown');
                const isAlreadyOpen = parentLi.classList.contains('active-link');
                
                // Close all other dropdowns
                document.querySelectorAll('.nav-item-dropdown').forEach(item => item.classList.remove('active-link'));
                megaMenus.forEach(menu => menu.classList.remove('show'));
                
                // Open the clicked one if it wasn't already open
                if (!isAlreadyOpen) {
                    parentLi.classList.add('active-link');
                    if (targetMenu) targetMenu.classList.add('show');
                }
            });
        });

        // Close dropdowns when clicking outside
        window.addEventListener('click', (event) => {
            if (!event.target.closest('.nav-item-dropdown')) {
                document.querySelectorAll('.nav-item-dropdown').forEach(item => item.classList.remove('active-link'));
                megaMenus.forEach(menu => menu.classList.remove('show'));
            }
        });
    };

    const initializeApp = async () => {
        let data = loadData();
        // --- PATHS UPDATED HERE ---
        // Updated path to reflect the folder structure 'components/header/header.html'
        await loadComponent('header-container', 'components/header/header.html');
        initializeHeaderMenu();

        if (data.user.name) {
            document.getElementById('homepage-sections').style.display = 'none';
            document.getElementById('dashboard-container').style.display = 'block';
            renderDashboard(data);
        } else {
            document.getElementById('dashboard-container').style.display = 'none';
            document.getElementById('homepage-sections').style.display = 'block';
            await loadHomepageSections();
        }
        
        // Updated path for the footer component, assuming a similar structure.
        // If your footer.html is not in a subfolder, change this back to 'components/footer.html'
        await loadComponent('footer-container', 'components/footer/footer.html');
    };
    
    initializeApp();
});