/* =================================================
   TripZyGo – Vanilla JavaScript
   Added Features: Auth, Booking, Reviews, Payment
   ================================================= */

document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'http://localhost:5000/api';

    /* ─────────────── TOAST UTILS ─────────────── */
    const toastEl = document.getElementById('toast');
    let toastTimeout;
    const showToast = (message, type = 'success') => {
        toastEl.textContent = message;
        toastEl.className = `toast show ${type}`;
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3000);
    };

    /* ─────────────── AUTH STATE ─────────────── */
    let currentUser = null;
    let token = localStorage.getItem('tripzygo_token') || null;

    // Check token on load
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp * 1000 > Date.now()) {
                // simple frontend decode; wait for backend for real user data
                currentUser = { id: payload.id }; 
                // We could fetch user details, but we will just trust it for UI toggle
            } else {
                logout();
            }
        } catch(e) { logout(); }
    }

    const authUI = () => {
        const btnOpenAuth = document.getElementById('btnOpenAuth');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        // Check localStorage name
        const storedName = localStorage.getItem('tripzygo_name');

        if (token && storedName) {
            btnOpenAuth.classList.add('hidden');
            userMenu.classList.remove('hidden');
            userName.textContent = storedName.split(' ')[0];
            userAvatar.textContent = storedName.charAt(0).toUpperCase();
        } else {
            btnOpenAuth.classList.remove('hidden');
            userMenu.classList.add('hidden');
        }
    };

    const logout = () => {
        token = null;
        currentUser = null;
        localStorage.removeItem('tripzygo_token');
        localStorage.removeItem('tripzygo_name');
        authUI();
        showToast('Logged out successfully', 'info');
    };

    authUI();

    /* ─────────────── API UTILS ─────────────── */
    const apiCall = async (endpoint, method = 'GET', body = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        try {
            const res = await fetch(`${API_URL}${endpoint}`, config);
            const data = await res.json();
            return { status: res.status, data };
        } catch (error) {
            return { status: 500, data: { success: false, message: 'Network error' } };
        }
    };


    /* ─────────────── MODAL LOGIC ─────────────── */
    const toggleModal = (modalId, show) => {
        const modal = document.getElementById(modalId);
        if (show) modal.classList.remove('hidden');
        else modal.classList.add('hidden');
    };

    // Auth Modal
    document.getElementById('btnOpenAuth').addEventListener('click', () => toggleModal('authModal', true));
    document.getElementById('closeAuthModal').addEventListener('click', () => toggleModal('authModal', false));

    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    const switchTab = (tab) => {
        if (tab === 'login') {
            tabLogin.classList.add('active'); tabSignup.classList.remove('active');
            loginForm.classList.remove('hidden'); signupForm.classList.add('hidden');
        } else {
            tabSignup.classList.add('active'); tabLogin.classList.remove('active');
            signupForm.classList.remove('hidden'); loginForm.classList.add('hidden');
        }
    };

    tabLogin.addEventListener('click', () => switchTab('login'));
    tabSignup.addEventListener('click', () => switchTab('signup'));
    document.getElementById('switchToSignup').addEventListener('click', () => switchTab('signup'));
    document.getElementById('switchToLogin').addEventListener('click', () => switchTab('login'));

    // Payment Modal
    document.getElementById('closePaymentModal').addEventListener('click', () => toggleModal('paymentModal', false));

    // Bookings Modal
    document.getElementById('closeBookingsModal').addEventListener('click', () => toggleModal('bookingsModal', false));

    // Review Modal
    document.getElementById('closeReviewModal').addEventListener('click', () => toggleModal('reviewModal', false));

    // User Dropdown
    const btnUserMenu = document.getElementById('btnUserMenu');
    const userDropdown = document.getElementById('userDropdown');
    btnUserMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => userDropdown.classList.remove('open'));

    document.getElementById('btnLogout').addEventListener('click', logout);

    /* ─────────────── AUTH API CALLS ─────────────── */
    
    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('loginError');
        const submitBtn = document.getElementById('loginSubmit');

        errorEl.classList.add('hidden');
        submitBtn.disabled = true; submitBtn.textContent = 'Logging in...';

        const { status, data } = await apiCall('/login', 'POST', { email, password });
        submitBtn.disabled = false; submitBtn.textContent = 'Login';

        if (data.success) {
            token = data.token;
            localStorage.setItem('tripzygo_token', token);
            localStorage.setItem('tripzygo_name', data.user.name);
            authUI();
            toggleModal('authModal', false);
            showToast(data.message);
        } else {
            errorEl.textContent = data.message;
            errorEl.classList.remove('hidden');
        }
    });

    // Signup
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const errorEl = document.getElementById('signupError');
        const submitBtn = document.getElementById('signupSubmit');

        errorEl.classList.add('hidden');
        submitBtn.disabled = true; submitBtn.textContent = 'Creating Account...';

        const { status, data } = await apiCall('/signup', 'POST', { name, email, password });
        submitBtn.disabled = false; submitBtn.textContent = 'Create Account';

        if (data.success) {
            token = data.token;
            localStorage.setItem('tripzygo_token', token);
            localStorage.setItem('tripzygo_name', data.user.name);
            authUI();
            toggleModal('authModal', false);
            showToast(data.message);
        } else {
            errorEl.textContent = data.message;
            errorEl.classList.remove('hidden');
        }
    });


    /* ─────────────── DATA ─────────────── */

    const CITIES = [
        {
            id: 'kolhapur', name: 'Kolhapur', tagline: 'City of Temples & Kolhapuri Chappals',
            img: 'https://picsum.photos/seed/kolhapur/400/300'
        },
        {
            id: 'pune', name: 'Pune', tagline: 'Oxford of the East – Culture & IT Hub',
            img: 'https://picsum.photos/seed/pune/400/300'
        },
        {
            id: 'sangli', name: 'Sangli', tagline: 'Grape Capital of Maharashtra',
            img: 'https://picsum.photos/seed/sangli/400/300'
        },
        {
            id: 'solapur', name: 'Solapur', tagline: 'City of Textile & History',
            img: 'https://picsum.photos/seed/solapur/400/300'
        },
        {
            id: 'satara', name: 'Satara', tagline: 'Land of Waterfalls & Forts',
            img: 'https://picsum.photos/seed/satara/400/300'
        }
    ];

    const HIDDEN_GEMS = [
        { title: 'Mahalaxmi Temple',   img: 'https://picsum.photos/seed/temple/400/300' },
        { title: 'Pashan Lake',         img: 'https://picsum.photos/seed/lake/400/300'   },
        { title: 'Khadakwasla Dam',     img: 'https://picsum.photos/seed/dam/400/300'    },
        { title: 'Shaniwar Wada',       img: 'https://picsum.photos/seed/fort/400/300'   },
        { title: 'Thoseghar Falls',     img: 'https://picsum.photos/seed/falls/400/300'  },
        { title: 'Kaas Plateau',        img: 'https://picsum.photos/seed/plateau/400/300'}
    ];

    const CITY_DETAILS = {
        kolhapur: {
            emoji: '🏛️',
            attractions: ['Mahalaxmi Temple', 'New Palace', 'Jyotiba Temple', 'Rankala Lake', 'Panhala Fort'],
            food: ['Kolhapuri Misal', 'Tambda/Pandhra Rassa', 'Kolhapuri Thali', 'Bhel Puri at Rankala'],
            hotels: [
                {name: 'Hotel Parle International', price: 2500}, 
                {name: 'Radhika Resort', price: 3000}, 
                {name: 'Hotel Pavillion', price: 2000}, 
                {name: 'Oyo Rooms Kolhapur', price: 1200}
            ],
            transport: ['Kolhapur Airport', 'Kolhapur Railway Station', 'City Bus by MSRTC', 'Auto Rickshaws'],
            guides: ['Best time to visit: October – March', 'Famous for Kolhapuri chappals & jewellery']
        },
        pune: {
            emoji: '🎓',
            attractions: ['Shaniwar Wada', 'Aga Khan Palace', 'Raja Dinkar Kelkar Museum', 'Sinhagad Fort'],
            food: ['Misal Pav', 'Vada Pav', 'Puranpoli', 'Bhakarwadi'],
            hotels: [
                {name: 'JW Marriott Pune', price: 8000}, 
                {name: 'Hyatt Regency Pune', price: 7500}, 
                {name: 'Hotel Kamats Athithi', price: 3500}, 
                {name: 'The Westin Pune', price: 9000}
            ],
            transport: ['Pune International Airport', 'Pune Railway Station & Shivajinagar', 'PMPML City Buses'],
            guides: ['Best time to visit: October – February', 'Explore FC Road']
        },
        sangli: {
            emoji: '🍇',
            attractions: ['Sangli Fort', 'Madhavrao Park', 'Ganapati Temple', 'Hiranyakeshwar Temple'],
            food: ['Kandi Bhakri', 'Pithla Bhakri', 'Grape Juice & Wine'],
            hotels: [
                {name: 'Hotel Bhagyashri', price: 2200}, 
                {name: 'Hotel Shree Krishna', price: 1800}, 
                {name: 'Hotel Sayaji Sangli', price: 3000}
            ],
            transport: ['Sangli Railway Station', 'Miraj Junction (nearby)', 'MSRTC Buses'],
            guides: ['Best time: November – February', 'Famous for its grapes']
        },
        solapur: {
            emoji: '🏰',
            attractions: ['Solapur Fort', 'Great Indian Bustard Wildlife Sanctuary', 'Siddheshwar Temple'],
            food: ['Bakarwadi', 'Shev Bhaji', 'Jowar Bhakri'],
            hotels: [
                {name: 'Hotel Vio Solapur', price: 1500}, 
                {name: 'The Heritage Hotel', price: 2000}, 
                {name: 'Hotel Surya Executive', price: 2500}
            ],
            transport: ['Solapur Airport', 'Solapur Railway Station', 'MSRTC City Bus'],
            guides: ['Best time: October – March', 'Famous for Solapur Terry Towels']
        },
        satara: {
            emoji: '⛲',
            attractions: ['Thoseghar Waterfalls', 'Kaas Plateau', 'Ajinkyatara Fort'],
            food: ['Modak', 'Pithla Bhakri', 'Dink Ladu'],
            hotels: [
                {name: 'Satara Resort & Spa', price: 3200}, 
                {name: 'Panorama Guest House', price: 1800}, 
                {name: 'Hotel Ajinkya', price: 2200}
            ],
            transport: ['Satara Railway Station', 'MSRTC Buses from Pune', 'Private cabs'],
            guides: ['Best time: July–September', 'Kaas Plateau open August to October only']
        }
    };

    const ITINERARY = {
        kolhapur: {
            1: ['🌅 Morning: Mahalaxmi Temple darshan', '☀️ Afternoon: New Palace museum tour', '🌇 Evening: Rankala Lake'],
            2: ['📅 Day 1: Same as 1-Day plan', '🌅 Day 2: Jyotiba Temple pilgrimage', '🌙 Day 2: Panhala Fort excursion']
        },
        pune: {
            1: ['🌅 Morning: Shaniwar Wada', '☀️ Afternoon: Aga Khan Palace', '🌙 Evening: Koregaon Park'],
            2: ['📅 Day 1: Same as 1-Day plan', '🌅 Day 2: Sinhagad Fort Trek', '🌇 Day 2: Dagdusheth Ganpati Temple']
        },
        sangli: {
            1: ['🌅 Morning: Sangli Fort & Ganapati Temple', '☀️ Afternoon: Madhavrao Park', '🌇 Evening: Grape vineyard'],
            2: ['📅 Day 1: Same as 1-Day plan', '🍇 Day 2: Full-day grape vineyard tour', '🌇 Day 2: Miraj town']
        },
        solapur: {
            1: ['🌅 Morning: Solapur Fort', '☀️ Afternoon: Great Indian Bustard Sanctuary', '🌙 Evening: Local street food'],
            2: ['📅 Day 1: Same as 1-Day plan', '🕌 Day 2: Pandharpur Vitthal Temple', '🛒 Day 2: Terry towel shopping']
        },
        satara: {
            1: ['🌅 Morning: Thoseghar Waterfalls', '☀️ Afternoon: Kaas Plateau', '🌇 Evening: Ajinkyatara Fort'],
            2: ['📅 Day 1: Same as 1-Day plan', '💨 Day 2: Chalkewadi windmill farm', '🌙 Day 2: Vastraharan Lake']
        }
    };

    /* ─────────────── LANGUAGE ─────────────── */
    let currentLang = 'en';

    const setLang = (lang) => {
        currentLang = lang;
        document.querySelectorAll('[data-en]').forEach(el => {
            if (el.children.length === 0) {
                el.textContent = el.dataset[lang];
            }
        });
        document.querySelectorAll('input[data-en]').forEach(inp => {
            inp.placeholder = inp.dataset[lang];
        });
        document.getElementById('langEn').classList.toggle('active', lang === 'en');
        document.getElementById('langMr').classList.toggle('active', lang === 'mr');
    };

    document.getElementById('langEn').addEventListener('click', () => setLang('en'));
    document.getElementById('langMr').addEventListener('click', () => setLang('mr'));

    /* ─────────────── MOBILE NAV ─────────────── */
    const navToggle = document.getElementById('navToggle');
    const navLinks  = document.getElementById('navLinks');

    navToggle.addEventListener('click', () => navLinks.classList.toggle('show'));

    navLinks.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-item')) navLinks.classList.remove('show');
    });

    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
            navLinks.classList.remove('show');
        }
    });

    /* ─────────────── CITY CARDS ─────────────── */
    const cityGrid = document.getElementById('cityGrid');

    const renderCities = (filter = '') => {
        cityGrid.innerHTML = '';
        const q = filter.toLowerCase().trim();
        const filtered = CITIES.filter(c =>
            c.name.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q)
        );
        if (filtered.length === 0) {
            cityGrid.innerHTML = '<p class="no-results">No cities match your search.</p>';
            return;
        }
        filtered.forEach(c => {
            const card = document.createElement('div');
            card.className = 'city-card';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.innerHTML = `
                <img src="${c.img}" alt="${c.name}" loading="lazy">
                <div class="card-body">
                    <h3>${c.name}</h3>
                    <p>${c.tagline}</p>
                </div>
            `;
            card.addEventListener('click', () => goToCity(c.id));
            card.addEventListener('keypress', (e) => { if (e.key === 'Enter') goToCity(c.id); });
            cityGrid.appendChild(card);
        });
    };

    /* ─────────────── SEARCH ─────────────── */
    const searchInput = document.getElementById('searchInput');
    const searchBtn   = document.getElementById('searchBtn');

    const doSearch = () => renderCities(searchInput.value);
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('input', doSearch);
    searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') doSearch(); });

    /* ─────────────── HIDDEN GEMS CAROUSEL ─────────────── */
    const gemsCarousel = document.getElementById('gemsCarousel');
    const gemPrevBtn   = document.getElementById('gemPrev');
    const gemNextBtn   = document.getElementById('gemNext');
    let gemIndex = 0;

    HIDDEN_GEMS.forEach(g => {
        const card = document.createElement('div');
        card.className = 'gem-card';
        card.innerHTML = `<img src="${g.img}" alt="${g.title}" loading="lazy"><div class="info">${g.title}</div>`;
        gemsCarousel.appendChild(card);
    });

    const getGemStepWidth = () => {
        const first = gemsCarousel.querySelector('.gem-card');
        if (!first) return 280;
        const style = getComputedStyle(gemsCarousel);
        const gap   = parseFloat(style.gap) || 16;
        return first.offsetWidth + gap;
    };

    const updateCarousel = () => {
        gemsCarousel.style.transform = `translateX(-${gemIndex * getGemStepWidth()}px)`;
        gemPrevBtn.disabled = gemIndex === 0;
        const visible = Math.floor(gemsCarousel.parentElement.offsetWidth / getGemStepWidth()) || 1;
        gemNextBtn.disabled = gemIndex >= HIDDEN_GEMS.length - visible;
    };

    gemPrevBtn.addEventListener('click', () => { if (gemIndex > 0) { gemIndex--; updateCarousel(); } });
    gemNextBtn.addEventListener('click', () => {
        const visible = Math.floor(gemsCarousel.parentElement.offsetWidth / getGemStepWidth()) || 1;
        if (gemIndex < HIDDEN_GEMS.length - visible) { gemIndex++; updateCarousel(); }
    });

    window.addEventListener('resize', updateCarousel);

    /* ─────────────── TRIP PLANNER ─────────────── */
    const planBtn         = document.getElementById('planBtn');
    const itineraryOutput = document.getElementById('itineraryOutput');

    planBtn.addEventListener('click', () => {
        const city = document.getElementById('plannerCity').value;
        const days = Number(document.getElementById('plannerDays').value);
        const plan = (ITINERARY[city] && ITINERARY[city][days]) || ['No itinerary available.'];
        itineraryOutput.innerHTML = `<strong>Your ${days}-Day ${city.charAt(0).toUpperCase() + city.slice(1)} Plan:</strong><ul>${plan.map(i => `<li>${i}</li>`).join('')}</ul>`;
        itineraryOutput.classList.add('visible');
    });

    /* ─────────────── BUDGET CALCULATOR ─────────────── */
    const budgetCalcBtn = document.getElementById('budgetCalcBtn');
    const budgetResult  = document.getElementById('budgetResult');

    budgetCalcBtn.addEventListener('click', () => {
        const perDay = Number(document.getElementById('budgetPerDay').value) || 0;
        const days   = Number(document.getElementById('budgetDays').value)   || 0;
        if (perDay <= 0 || days <= 0) return budgetResult.textContent = 'Please enter valid values.';
        budgetResult.textContent = `Estimated Total: ₹${(perDay * days).toLocaleString('en-IN')}`;
    });

    /* ─────────────── NAVIGATION ─────────────── */
    const homeSection = document.getElementById('homeSection');
    const citySection = document.getElementById('citySection');
    const cityTitle   = document.getElementById('cityTitle');
    const cityContent = document.getElementById('cityContent');
    const citySubNav  = document.getElementById('citySubNav');
    
    let currentCityId = null;

    const showHome = () => {
        homeSection.hidden = false; citySection.hidden = true;
        history.replaceState(null, '', window.location.pathname);
        setActiveNavItem('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        currentCityId = null;
    };

    const goToCity = (cityId) => {
        if (!CITY_DETAILS[cityId]) return;
        history.pushState({ cityId }, '', `#city-${cityId}`);
        renderCityPage(cityId);
    };

    const sectionIcons = { attractions: '🏛️', food: '🍽️', hotels: '🏨', transport: '🚌', guides: '📖' };

    const renderCityPage = (cityId) => {
        const data = CITY_DETAILS[cityId];
        if (!data) { showHome(); return; }
        currentCityId = cityId;

        const cityObj = CITIES.find(c => c.id === cityId);
        cityTitle.textContent = `${data.emoji || ''} ${cityObj ? cityObj.name : cityId}`;
        homeSection.hidden = true; citySection.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveNavItem('city', cityId);

        const renderSection = (section) => {
            const icon  = sectionIcons[section] || '';
            const items = data[section] || [];
            
            if (section === 'hotels') {
                cityContent.innerHTML = `<h3>${icon} Hotels & Stay</h3>`;
                items.forEach(h => {
                    cityContent.innerHTML += `
                        <div class="hotel-item">
                            <div class="hotel-item-name">
                                <strong>${h.name}</strong> <br> <small>₹${h.price} / night</small>
                            </div>
                            <div class="hotel-actions">
                                <button class="btn-review" onclick="openReviewModal('${h.name}', '${cityId}')">⭐ Reviews</button>
                                <button class="btn-book" onclick="openPaymentModal('${h.name}', '${cityId}', ${h.price})">Book Now</button>
                            </div>
                        </div>
                    `;
                });
            } else {
                cityContent.innerHTML = `<h3>${icon} ${section.charAt(0).toUpperCase() + section.slice(1)}</h3><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
            }
        };

        const newSubNav = citySubNav.cloneNode(true);
        citySubNav.parentNode.replaceChild(newSubNav, citySubNav);
        const liveSubNav = document.getElementById('citySubNav');

        liveSubNav.querySelectorAll('.city-sublink').forEach(link => {
            link.classList.toggle('active', link.dataset.section === 'attractions');
            link.textContent = link.dataset[currentLang] || link.dataset.en;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                liveSubNav.querySelectorAll('.city-sublink').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                renderSection(link.dataset.section);
            });
        });

        renderSection('attractions');
    };

    const setActiveNavItem = (page, cityId = null) => {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (page === 'home' && item.dataset.page === 'home') item.classList.add('active');
            if (page === 'city' && cityId && item.href && item.href.endsWith(`#city-${cityId}`)) item.classList.add('active');
        });
    };

    document.getElementById('backToHome').addEventListener('click', (e) => { e.preventDefault(); showHome(); });
    document.getElementById('logoLink').addEventListener('click', (e) => { e.preventDefault(); showHome(); });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');
            if (href === '#') { e.preventDefault(); showHome(); }
            else if (href && href.startsWith('#city-')) { e.preventDefault(); goToCity(href.replace('#city-', '')); }
        });
    });

    window.addEventListener('popstate', () => {
        const hash = window.location.hash;
        if (hash.startsWith('#city-')) renderCityPage(hash.replace('#city-', ''));
        else showHome();
    });


    /* ─────────────── BOOKING & PAYMENT LOGIC ─────────────── */
    let currentBookingData = null;

    window.openPaymentModal = (hotelName, cityId, price) => {
        if (!token) {
            showToast('Please login to book a hotel', 'error');
            toggleModal('authModal', true);
            return;
        }

        // Mock dates
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        currentBookingData = {
            hotelName,
            cityId,
            checkIn: today.toISOString(),
            checkOut: tomorrow.toISOString(),
            guests: 2,
            totalCost: price
        };

        const summary = document.getElementById('paymentSummary');
        summary.innerHTML = `
            <p><strong>Hotel:</strong> ${hotelName}</p>
            <p><strong>City:</strong> ${cityId}</p>
            <p><strong>Amount:</strong> <span class="pay-amount">₹${price}</span></p>
        `;

        toggleModal('paymentModal', true);
    };

    const paymentMethodSelect = document.getElementById('paymentMethod');
    paymentMethodSelect.addEventListener('change', (e) => {
        const isUpi = e.target.value === 'upi';
        document.getElementById('cardFields').classList.toggle('hidden', isUpi);
        document.getElementById('upiField').classList.toggle('hidden', !isUpi);
    });

    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('paymentError');
        const payBtn = document.getElementById('payNowBtn');
        const method = paymentMethodSelect.value;
        
        errorEl.classList.add('hidden');
        payBtn.disabled = true; payBtn.textContent = 'Processing...';

        try {
            // 1. Process payment
            const payRes = await apiCall('/payment', 'POST', {
                hotelName: currentBookingData.hotelName,
                amount: currentBookingData.totalCost,
                method
            });

            if (!payRes.data.success) throw new Error(payRes.data.message);

            // 2. Create booking
            currentBookingData.paymentId = payRes.data.payment.transactionId;
            const bookRes = await apiCall('/book', 'POST', currentBookingData);

            if (!bookRes.data.success) throw new Error(bookRes.data.message);

            showToast(bookRes.data.message);
            toggleModal('paymentModal', false);
            // Optionally clear fields
            
        } catch (error) {
            errorEl.textContent = error.message || 'Payment failed';
            errorEl.classList.remove('hidden');
        } finally {
            payBtn.disabled = false; payBtn.textContent = 'Pay Now';
        }
    });

    /* ─────────────── MY BOOKINGS ─────────────── */
    document.getElementById('btnMyBookings').addEventListener('click', async () => {
        toggleModal('bookingsModal', true);
        const list = document.getElementById('bookingsList');
        list.innerHTML = '<p class="bookings-empty">Loading bookings...</p>';

        const { status, data } = await apiCall('/my-bookings');
        if (data.success && data.bookings.length > 0) {
            list.innerHTML = data.bookings.map(b => `
                <div class="booking-card">
                    <h4>${b.hotelName} (${b.cityId})</h4>
                    <p><strong>Check-in:</strong> ${new Date(b.checkIn).toLocaleDateString()}</p>
                    <p><strong>Total Cost:</strong> ₹${b.totalCost}</p>
                    <span class="booking-badge ${b.status}">${b.status.toUpperCase()}</span>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<p class="bookings-empty">No bookings found.</p>';
        }
    });

    /* ─────────────── REVIEWS LOGIC ─────────────── */
    let currentReviewHotel = '';
    let currentReviewCity = '';
    const reviewRatingInput = document.getElementById('reviewRating');

    window.openReviewModal = async (hotelName, cityId) => {
        currentReviewHotel = hotelName;
        currentReviewCity = cityId;
        document.getElementById('reviewHotelName').textContent = hotelName;
        
        // Reset stars
        document.querySelectorAll('.star-rating button').forEach(b => b.classList.remove('lit'));
        reviewRatingInput.value = '0';
        document.getElementById('reviewComment').value = '';
        
        toggleModal('reviewModal', true);

        // Fetch existing reviews
        const list = document.getElementById('reviewsList');
        list.innerHTML = '<p class="reviews-empty">Loading reviews...</p>';

        const { status, data } = await apiCall(`/reviews/${encodeURIComponent(hotelName)}`);
        if (data.success && data.reviews.length > 0) {
            list.innerHTML = data.reviews.map(r => `
                <div class="review-card">
                    <div class="review-meta">
                        <span class="review-author">${r.userName}</span>
                        <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                    </div>
                    <div class="review-text">${r.comment}</div>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<p class="reviews-empty">No reviews yet. Be the first to review!</p>';
        }
    };

    // Star rating selection
    document.querySelectorAll('.star-rating button').forEach(star => {
        star.addEventListener('click', (e) => {
            const val = e.target.getAttribute('data-val');
            reviewRatingInput.value = val;
            document.querySelectorAll('.star-rating button').forEach(b => {
                b.classList.toggle('lit', parseInt(b.getAttribute('data-val')) <= val);
            });
        });
    });

    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!token) {
            showToast('Please login to leave a review', 'error');
            toggleModal('reviewModal', false);
            toggleModal('authModal', true);
            return;
        }

        const errorEl = document.getElementById('reviewError');
        const submitBtn = document.getElementById('submitReviewBtn');
        const rating = reviewRatingInput.value;
        const comment = document.getElementById('reviewComment').value;

        if (rating === '0') {
            errorEl.textContent = 'Please select a rating';
            errorEl.classList.remove('hidden');
            return;
        }

        errorEl.classList.add('hidden');
        submitBtn.disabled = true; submitBtn.textContent = 'Submitting...';

        const { status, data } = await apiCall('/review', 'POST', {
            hotelName: currentReviewHotel,
            cityId: currentReviewCity,
            rating,
            comment
        });

        submitBtn.disabled = false; submitBtn.textContent = 'Submit Review';

        if (data.success) {
            showToast(data.message);
            // Refresh reviews list
            openReviewModal(currentReviewHotel, currentReviewCity);
        } else {
            errorEl.textContent = data.message;
            errorEl.classList.remove('hidden');
        }
    });

    /* ─────────────── INIT ─────────────── */
    const init = () => {
        renderCities();
        setLang('en');
        updateCarousel();

        const hash = window.location.hash;
        if (hash.startsWith('#city-')) renderCityPage(hash.replace('#city-', ''));
        else showHome();
    };

    init();
});
