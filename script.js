// ==================== GLOBAL STATE ====================
let currentStep = 1;
const totalSteps = 9; // Enhanced to 9 steps
let patientQueue = [];
let doctorNotificationsEnabled = true;

// Patient Status States
const PatientStatus = {
    WAITING: 'waiting',
    CALLED_TO_CABIN: 'called',
    IN_CONSULTATION: 'consulting',
    COMPLETED: 'completed'
};

// ==================== PARTICLE ANIMATION ====================
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 50;
    
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
            if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
        }
        
        draw() {
            ctx.fillStyle = `rgba(30, 58, 138, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Draw connections
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.strokeStyle = `rgba(30, 58, 138, ${0.2 * (1 - distance / 100)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// ==================== SMOOTH SCROLLING ====================
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==================== NAVIGATION ACTIVE STATE ====================
function updateNavigation() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    });
}

// ==================== FORM STEP NAVIGATION ====================
function changeStep(direction) {
    const steps = document.querySelectorAll('.form-step');
    const currentStepElement = steps[currentStep - 1];
    
    // Validate current step before moving forward
    if (direction > 0) {
        const inputs = currentStepElement.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (input.type === 'radio') {
                const radioGroup = currentStepElement.querySelectorAll(`input[name="${input.name}"]`);
                const isChecked = Array.from(radioGroup).some(radio => radio.checked);
                if (!isChecked) {
                    isValid = false;
                }
            } else if (!input.value) {
                input.style.borderColor = '#EF4444';
                isValid = false;
            } else {
                input.style.borderColor = '';
            }
        });
        
        if (!isValid) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
    }
    
    // Update step
    currentStep += direction;
    
    if (currentStep < 1) currentStep = 1;
    if (currentStep > totalSteps) currentStep = totalSteps;
    
    // Update UI
    updateFormUI();
}

function updateFormUI() {
    const steps = document.querySelectorAll('.form-step');
    const progressFill = document.getElementById('progressFill');
    const currentStepText = document.getElementById('currentStep');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    // Update step visibility
    steps.forEach((step, index) => {
        step.classList.remove('active');
        if (index === currentStep - 1) {
            step.classList.add('active');
        }
    });
    
    // Update progress bar
    const progress = (currentStep / totalSteps) * 100;
    progressFill.style.width = `${progress}%`;
    currentStepText.textContent = currentStep;
    
    // Update buttons
    prevBtn.style.display = currentStep === 1 ? 'none' : 'block';
    nextBtn.style.display = currentStep === totalSteps ? 'none' : 'block';
    submitBtn.style.display = currentStep === totalSteps ? 'block' : 'none';
}

// ==================== SEVERITY SLIDER ====================
function initSeveritySlider() {
    const slider = document.getElementById('severity');
    const severityValue = document.getElementById('severityValue');
    
    if (slider && severityValue) {
        slider.addEventListener('input', (e) => {
            severityValue.textContent = e.target.value;
        });
    }
}

// ==================== 3-LAYER CONTEXT-AWARE AI TRIAGE ALGORITHM ====================
function analyzeSymptoms(formData) {
    const analysis = {
        layers: {},
        scores: {},
        factors: [],
        contextFactors: [],
        detailedBreakdown: {}
    };
    
    let totalScore = 0;
    
    // ========== LAYER 1: SYMPTOM SEVERITY ANALYSIS (40 points) ==========
    const layer1 = analyzeSymptomSeverity(formData);
    analysis.layers.layer1 = layer1;
    analysis.scores.symptomScore = layer1.score;
    totalScore += layer1.score;
    
    // ========== LAYER 2: PATIENT CONTEXT ANALYSIS (35 points) ==========
    const layer2 = analyzePatientContext(formData);
    analysis.layers.layer2 = layer2;
    analysis.scores.contextScore = layer2.score;
    totalScore += layer2.score;
    
    // ========== LAYER 3: TEMPORAL & PROGRESSION (15 points) ==========
    const layer3 = analyzeProgressionAndTiming(formData);
    analysis.layers.layer3 = layer3;
    analysis.scores.progressionScore = layer3.score;
    totalScore += layer3.score;
    
    // ========== EMERGENCY FLAGS (10 points bonus) ==========
    const emergencyBonus = analyzeEmergencyFlags(formData);
    analysis.scores.emergencyBonus = emergencyBonus.score;
    totalScore += emergencyBonus.score;
    
    analysis.totalScore = Math.min(totalScore, 100);
    
    // Combine all factors
    analysis.factors = [
        ...layer1.factors,
        ...layer2.factors,
        ...layer3.factors,
        ...emergencyBonus.factors
    ];
    
    analysis.contextFactors = [
        ...layer2.contextFactors,
        ...emergencyBonus.criticalFlags
    ];
    
    // Determine priority, routing, and recommendations
    const classification = classifyPriority(analysis.totalScore, formData, analysis);
    analysis.priority = classification.priority;
    analysis.priorityLevel = classification.priorityLevel;
    analysis.icon = classification.icon;
    analysis.title = classification.title;
    analysis.description = classification.description;
    analysis.recommendations = classification.recommendations;
    analysis.routing = classification.routing;
    
    // Detailed breakdown for explainability
    analysis.detailedBreakdown = {
        symptomAnalysis: layer1.breakdown,
        contextAnalysis: layer2.breakdown,
        progressionAnalysis: layer3.breakdown,
        emergencyFlags: emergencyBonus.breakdown
    };
    
    return analysis;
}

// ========== LAYER 1: SYMPTOM SEVERITY ANALYSIS ==========
function analyzeSymptomSeverity(formData) {
    let score = 0;
    const factors = [];
    const breakdown = [];
    
    // Emergency symptoms (35-40 points)
    const emergencySymptoms = {
        'chest-pain': { score: 40, label: 'Chest pain (critical cardiac risk)' },
        'breathing-difficulty': { score: 38, label: 'Breathing difficulty (respiratory emergency)' },
        'severe-headache': { score: 35, label: 'Severe headache (possible stroke/aneurysm)' },
        'allergic-reaction': { score: 37, label: 'Allergic reaction (anaphylaxis risk)' },
        'confusion': { score: 36, label: 'Confusion/altered mental state' },
        'bleeding': { score: 38, label: 'Severe bleeding (hemorrhage risk)' }
    };
    
    // Urgent symptoms (25-30 points)
    const urgentSymptoms = {
        'abdominal-pain': { score: 28, label: 'Abdominal pain' },
        'dizziness': { score: 27, label: 'Dizziness/fainting' },
        'injury': { score: 26, label: 'Injury/trauma' }
    };
    
    // Routine symptoms (10-20 points)
    const routineSymptoms = {
        'fever': { score: 18, label: 'Fever' },
        'nausea': { score: 15, label: 'Nausea/vomiting' },
        'cough': { score: 12, label: 'Persistent cough' },
        'other': { score: 10, label: 'Other symptoms' }
    };
    
    const symptom = formData.symptom;
    let symptomInfo;
    
    if (emergencySymptoms[symptom]) {
        symptomInfo = emergencySymptoms[symptom];
        score = symptomInfo.score;
        factors.push(`CRITICAL: ${symptomInfo.label}`);
        breakdown.push({ category: 'Symptom Type', points: score, reason: symptomInfo.label, severity: 'critical' });
    } else if (urgentSymptoms[symptom]) {
        symptomInfo = urgentSymptoms[symptom];
        score = symptomInfo.score;
        factors.push(`URGENT: ${symptomInfo.label}`);
        breakdown.push({ category: 'Symptom Type', points: score, reason: symptomInfo.label, severity: 'urgent' });
    } else {
        symptomInfo = routineSymptoms[symptom] || routineSymptoms['other'];
        score = symptomInfo.score;
        factors.push(`Routine: ${symptomInfo.label}`);
        breakdown.push({ category: 'Symptom Type', points: score, reason: symptomInfo.label, severity: 'routine' });
    }
    
    return { score, factors, breakdown };
}

// ========== LAYER 2: PATIENT CONTEXT ANALYSIS (UNIQUE!) ==========
function analyzePatientContext(formData) {
    let score = 0;
    const factors = [];
    const contextFactors = [];
    const breakdown = [];
    
    const age = parseInt(formData.age);
    const conditions = formData.conditions || [];
    const symptom = formData.symptom;
    const severity = parseInt(formData.severity);
    
    // 1. AGE RISK ASSESSMENT (15 points max)
    let ageScore = 0;
    let ageCategory = '';
    
    if (age < 2) {
        ageScore = 15;
        ageCategory = 'Infant';
        factors.push('CRITICAL: Infant (< 2 years) - High vulnerability');
        contextFactors.push('Infant age group - Increased medical risk');
        breakdown.push({ category: 'Age Risk', points: 15, reason: 'Infant - High vulnerability', severity: 'critical' });
    } else if (age < 12) {
        ageScore = 8;
        ageCategory = 'Child';
        factors.push('Child (2-12 years) - Pediatric considerations');
        contextFactors.push('Pediatric patient - Special monitoring needed');
        breakdown.push({ category: 'Age Risk', points: 8, reason: 'Child - Pediatric care needed', severity: 'moderate' });
    } else if (age > 65) {
        ageScore = 15;
        ageCategory = 'Elderly';
        factors.push('CRITICAL: Elderly (> 65 years) - Comorbidity risk');
        contextFactors.push('Elderly patient - Higher complication risk');
        breakdown.push({ category: 'Age Risk', points: 15, reason: 'Elderly - Increased risk factors', severity: 'critical' });
    } else {
        ageScore = 5;
        ageCategory = 'Adult';
        breakdown.push({ category: 'Age Risk', points: 5, reason: 'Adult - Standard risk', severity: 'low' });
    }
    
    score += ageScore;
    
    // 2. COMORBIDITY ANALYSIS (15 points max)
    let comorbidityScore = 0;
    
    if (conditions.length > 0 && !conditions.includes('none')) {
        // Critical comorbidity combinations
        const criticalCombos = [
            { symptom: 'chest-pain', condition: 'heart-disease', score: 15, text: 'Chest pain with heart disease history' },
            { symptom: 'breathing-difficulty', condition: 'asthma', score: 12, text: 'Breathing difficulty with asthma' },
            { symptom: 'severe-headache', condition: 'hypertension', score: 12, text: 'Severe headache with hypertension' },
            { symptom: 'fever', condition: 'immunocompromised', score: 13, text: 'Fever in immunocompromised patient' },
            { symptom: 'confusion', condition: 'diabetes', score: 14, text: 'Altered mental state with diabetes' }
        ];
        
        let criticalComboFound = false;
        criticalCombos.forEach(combo => {
            if (symptom === combo.symptom && conditions.includes(combo.condition)) {
                comorbidityScore = Math.max(comorbidityScore, combo.score);
                factors.push(`CRITICAL COMBO: ${combo.text}`);
                contextFactors.push(combo.text);
                breakdown.push({ category: 'Comorbidity Risk', points: combo.score, reason: combo.text, severity: 'critical' });
                criticalComboFound = true;
            }
        });
        
        if (!criticalComboFound) {
            // High-risk conditions
            const highRiskConditions = ['heart-disease', 'cancer', 'kidney-disease', 'immunocompromised'];
            const hasHighRisk = conditions.some(c => highRiskConditions.includes(c));
            
            if (hasHighRisk) {
                comorbidityScore = 10;
                factors.push('High-risk pre-existing conditions');
                contextFactors.push(`Pre-existing: ${conditions.filter(c => highRiskConditions.includes(c)).join(', ')}`);
                breakdown.push({ category: 'Comorbidity Risk', points: 10, reason: 'High-risk medical history', severity: 'high' });
            } else {
                comorbidityScore = 5;
                factors.push('Pre-existing medical conditions present');
                contextFactors.push(`Conditions: ${conditions.join(', ')}`);
                breakdown.push({ category: 'Comorbidity Risk', points: 5, reason: 'Standard medical history', severity: 'moderate' });
            }
        }
    } else {
        breakdown.push({ category: 'Comorbidity Risk', points: 0, reason: 'No pre-existing conditions', severity: 'low' });
    }
    
    score += comorbidityScore;
    
    // 3. SEVERITY LEVEL MODULATION (5 points)
    if (severity >= 8) {
        score += 5;
        factors.push(`High severity level: ${severity}/10`);
        breakdown.push({ category: 'Severity Modifier', points: 5, reason: `Severe pain/discomfort (${severity}/10)`, severity: 'high' });
    } else if (severity >= 6) {
        score += 3;
        breakdown.push({ category: 'Severity Modifier', points: 3, reason: `Moderate pain/discomfort (${severity}/10)`, severity: 'moderate' });
    } else {
        breakdown.push({ category: 'Severity Modifier', points: 0, reason: `Mild pain/discomfort (${severity}/10)`, severity: 'low' });
    }
    
    return { score, factors, contextFactors, breakdown };
}

// ========== LAYER 3: PROGRESSION & TIMING ANALYSIS ==========
function analyzeProgressionAndTiming(formData) {
    let score = 0;
    const factors = [];
    const breakdown = [];
    
    // 1. SYMPTOM PROGRESSION (5 points)
    const progression = formData.progression;
    
    if (progression === 'worsening') {
        score += 5;
        factors.push('CRITICAL: Symptoms worsening rapidly');
        breakdown.push({ category: 'Progression', points: 5, reason: 'Rapidly worsening symptoms', severity: 'critical' });
    } else if (progression === 'stable') {
        score += 2;
        factors.push('Symptoms stable');
        breakdown.push({ category: 'Progression', points: 2, reason: 'Stable condition', severity: 'moderate' });
    } else if (progression === 'improving') {
        score += 0;
        factors.push('Symptoms improving');
        breakdown.push({ category: 'Progression', points: 0, reason: 'Improving condition', severity: 'low' });
    }
    
    // 2. DURATION/ONSET (10 points)
    const duration = formData.duration;
    
    if (duration === 'less-1-hour') {
        score += 10;
        factors.push('CRITICAL: Sudden onset (< 1 hour)');
        breakdown.push({ category: 'Onset Timing', points: 10, reason: 'Acute sudden onset', severity: 'critical' });
    } else if (duration === '1-6-hours') {
        score += 8;
        factors.push('Recent onset (1-6 hours)');
        breakdown.push({ category: 'Onset Timing', points: 8, reason: 'Recent acute onset', severity: 'high' });
    } else if (duration === '6-24-hours') {
        score += 5;
        factors.push('Onset within 24 hours');
        breakdown.push({ category: 'Onset Timing', points: 5, reason: 'Recent onset', severity: 'moderate' });
    } else if (duration === '1-3-days') {
        score += 3;
        breakdown.push({ category: 'Onset Timing', points: 3, reason: 'Subacute (1-3 days)', severity: 'moderate' });
    } else {
        score += 2;
        breakdown.push({ category: 'Onset Timing', points: 2, reason: 'Chronic symptoms', severity: 'low' });
    }
    
    return { score, factors, breakdown };
}

// ========== EMERGENCY FLAGS ANALYSIS ==========
function analyzeEmergencyFlags(formData) {
    let score = 0;
    const factors = [];
    const criticalFlags = [];
    const breakdown = [];
    
    const emergencyFlags = formData.emergencyFlags || [];
    
    if (emergencyFlags.length > 0 && !emergencyFlags.includes('none')) {
        const flagScores = {
            'loss-consciousness': { score: 10, text: 'Loss of consciousness/fainting' },
            'chest-pain-radiating': { score: 10, text: 'Chest pain radiating to arm/jaw' },
            'severe-bleeding': { score: 10, text: 'Uncontrolled severe bleeding' },
            'slurred-speech': { score: 10, text: 'Slurred speech/confusion (stroke signs)' },
            'blue-lips': { score: 10, text: 'Cyanosis (blue lips/face)' },
            'seizure': { score: 10, text: 'Seizure activity' }
        };
        
        emergencyFlags.forEach(flag => {
            if (flagScores[flag]) {
                score = 10; // Any emergency flag adds maximum points
                factors.push(`EMERGENCY FLAG: ${flagScores[flag].text}`);
                criticalFlags.push(flagScores[flag].text);
            }
        });
        
        if (score > 0) {
            breakdown.push({ category: 'Emergency Flags', points: 10, reason: `${criticalFlags.length} critical warning sign(s) detected`, severity: 'critical' });
        }
    } else {
        breakdown.push({ category: 'Emergency Flags', points: 0, reason: 'No emergency warning signs', severity: 'low' });
    }
    
    return { score, factors, criticalFlags, breakdown };
}

// ========== PRIORITY CLASSIFICATION & SMART ROUTING ==========
function classifyPriority(score, formData, analysis) {
    let priority, priorityLevel, icon, title, description, recommendations, routing;
    
    if (score >= 75) {
        // EMERGENCY
        priority = 'emergency';
        priorityLevel = 'EMERGENCY';
        icon = '🚨';
        title = 'Immediate Emergency Care Required';
        description = 'Based on comprehensive AI analysis, your symptoms require immediate emergency medical attention. Multiple high-risk factors have been identified.';
        
        routing = {
            destination: 'Emergency Department (ER)',
            action: 'Call 911 / Go to ER immediately',
            waitTime: '0 minutes - Immediate',
            transportMethod: 'Ambulance or emergency transportation'
        };
        
        recommendations = [
            '🚨 Call emergency services (911) IMMEDIATELY',
            '🚗 Do NOT drive yourself - request ambulance or immediate assistance',
            '👤 Inform someone nearby of your condition',
            '💊 Gather current medications and medical records if possible',
            '📱 Stay on the line with emergency operator and follow instructions',
            '⚠️ Do not eat or drink anything until assessed by medical professionals'
        ];
        
    } else if (score >= 50) {
        // URGENT
        priority = 'urgent';
        priorityLevel = 'URGENT CARE NEEDED';
        icon = '⚠️';
        title = 'Urgent Medical Attention Recommended';
        description = 'Your symptoms indicate you should see a healthcare provider within the next 24-48 hours. Context factors suggest this requires prompt medical evaluation.';
        
        routing = {
            destination: 'Urgent Care Clinic / Doctor Office',
            action: 'Schedule appointment within 24-48 hours',
            waitTime: '1-2 days maximum',
            transportMethod: 'Personal transportation acceptable'
        };
        
        recommendations = [
            '📅 Schedule doctor appointment within next 24-48 hours',
            '🏥 Consider urgent care clinic if primary doctor unavailable',
            '📊 Monitor symptoms closely - note any changes',
            '📝 Keep detailed symptom diary (time, severity, changes)',
            '👨‍⚕️ Seek emergency care if symptoms suddenly worsen',
            '💊 Continue current medications as prescribed',
            '☎️ Call doctor office if symptoms progress before appointment'
        ];
        
    } else {
        // ROUTINE
        priority = 'routine';
        priorityLevel = 'ROUTINE CARE';
        icon = '✅';
        title = 'Self-Care with Monitoring';
        description = 'Your symptoms appear manageable with self-care and home monitoring. Schedule a routine checkup if symptoms persist or worsen.';
        
        routing = {
            destination: 'Home Care / Telehealth',
            action: 'Self-monitoring and home care',
            waitTime: '3-7 days if symptoms persist',
            transportMethod: 'Routine appointment (no urgency)'
        };
        
        recommendations = [
            '🏠 Rest adequately and stay well-hydrated',
            '📊 Monitor symptoms for next 3-7 days',
            '💊 Use over-the-counter remedies as appropriate',
            '📱 Consider telehealth consultation if concerned',
            '📅 Schedule routine appointment if no improvement',
            '🥗 Maintain healthy diet and lifestyle habits',
            '⚠️ Seek urgent care if symptoms worsen significantly'
        ];
    }
    
    return { priority, priorityLevel, icon, title, description, recommendations, routing };
}

// ==================== FORM SUBMISSION ====================
function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = document.getElementById('triageForm');
    const formData = new FormData(form);
    
    // Collect comprehensive form data
    const patientData = {
        name: formData.get('patientName'),
        age: formData.get('age'),
        gender: formData.get('gender'),
        symptom: formData.get('mainSymptom'),
        severity: formData.get('severity'),
        duration: formData.get('duration'),
        progression: formData.get('progression'),
        conditions: Array.from(formData.getAll('conditions')),
        emergencyFlags: Array.from(formData.getAll('emergencyFlags')),
        medications: formData.get('medications'),
        additionalInfo: formData.get('additionalInfo'),
        timestamp: new Date()
    };
    
    // Show loading indicator
    showNotification('Analyzing with AI...', 'info');
    
    // Simulate AI processing time
    setTimeout(() => {
        // Analyze with 3-Layer Context-Aware AI
        const analysis = analyzeSymptoms(patientData);
        
        // Add to patient queue
        const patient = {
            ...patientData,
            ...analysis,
            id: Date.now(),
            status: PatientStatus.WAITING,
            submittedAt: new Date(),
            calledAt: null,
            consultationStarted: null,
            completedAt: null
        };
        
        patientQueue.unshift(patient);
        sortPatientQueue();
        
        // Send notification to doctor
        notifyDoctor(patient);
        
        // Display result with explainability
        displayEnhancedResult(analysis, patientData);
        
        // Update dashboard
        updateDashboard();
        
        // Hide form, show result
        document.getElementById('triage').style.display = 'none';
        document.getElementById('result').style.display = 'block';
        
        // Scroll to result
        scrollToSection('result');
        
        showNotification('Analysis complete! ✓', 'success');
    }, 1500);
}

// ==================== ENHANCED RESULT DISPLAY WITH EXPLAINABILITY ====================
function displayEnhancedResult(analysis, patientData) {
    const resultCard = document.getElementById('resultCard');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultPriority = document.getElementById('resultPriority');
    const resultDescription = document.getElementById('resultDescription');
    
    // Update card styling
    resultCard.className = `result-card ${analysis.priority}`;
    
    // Update basic content
    resultIcon.textContent = analysis.icon;
    resultTitle.textContent = analysis.title;
    resultPriority.textContent = analysis.priorityLevel;
    resultPriority.className = `result-priority ${analysis.priority}`;
    resultDescription.textContent = analysis.description;
    
    // ========== EXPLAINABILITY PANEL (UNIQUE FEATURE!) ==========
    displayExplainabilityPanel(analysis);
    
    // ========== SMART ROUTING PANEL ==========
    displayRoutingPanel(analysis.routing);
    
    // ========== RECOMMENDATIONS ==========
    displayRecommendations(analysis.recommendations);
}

// ========== EXPLAINABILITY PANEL ==========
function displayExplainabilityPanel(analysis) {
    const riskBreakdown = document.getElementById('riskBreakdown');
    const scoreValue = document.getElementById('scoreValue');
    const scoreCircle = document.getElementById('scoreCircle');
    const scoreFactors = document.getElementById('scoreFactors');
    
    // Display total score
    scoreValue.textContent = analysis.totalScore;
    
    // Color code the score circle
    if (analysis.priority === 'emergency') {
        scoreCircle.style.background = 'conic-gradient(#EF4444 ' + (analysis.totalScore * 3.6) + 'deg, rgba(239, 68, 68, 0.1) 0deg)';
    } else if (analysis.priority === 'urgent') {
        scoreCircle.style.background = 'conic-gradient(#F59E0B ' + (analysis.totalScore * 3.6) + 'deg, rgba(245, 158, 11, 0.1) 0deg)';
    } else {
        scoreCircle.style.background = 'conic-gradient(#22C55E ' + (analysis.totalScore * 3.6) + 'deg, rgba(34, 197, 94, 0.1) 0deg)';
    }
    
    // Build detailed breakdown
    let breakdownHTML = '<div class="breakdown-sections">';
    
    // Layer 1: Symptom Severity
    breakdownHTML += `
        <div class="breakdown-layer">
            <div class="layer-header">
                <span class="layer-icon">🎯</span>
                <span class="layer-title">Layer 1: Symptom Severity</span>
                <span class="layer-score">${analysis.scores.symptomScore} pts</span>
            </div>
            <div class="layer-details">
                ${analysis.detailedBreakdown.symptomAnalysis.map(item => `
                    <div class="detail-item ${item.severity}">
                        <span class="detail-label">${item.category}:</span>
                        <span class="detail-value">+${item.points} pts</span>
                        <div class="detail-reason">${item.reason}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Layer 2: Patient Context
    breakdownHTML += `
        <div class="breakdown-layer">
            <div class="layer-header">
                <span class="layer-icon">🧠</span>
                <span class="layer-title">Layer 2: Patient Context</span>
                <span class="layer-score">${analysis.scores.contextScore} pts</span>
            </div>
            <div class="layer-details">
                ${analysis.detailedBreakdown.contextAnalysis.map(item => `
                    <div class="detail-item ${item.severity}">
                        <span class="detail-label">${item.category}:</span>
                        <span class="detail-value">+${item.points} pts</span>
                        <div class="detail-reason">${item.reason}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Layer 3: Progression & Timing
    breakdownHTML += `
        <div class="breakdown-layer">
            <div class="layer-header">
                <span class="layer-icon">📈</span>
                <span class="layer-title">Layer 3: Progression & Timing</span>
                <span class="layer-score">${analysis.scores.progressionScore} pts</span>
            </div>
            <div class="layer-details">
                ${analysis.detailedBreakdown.progressionAnalysis.map(item => `
                    <div class="detail-item ${item.severity}">
                        <span class="detail-label">${item.category}:</span>
                        <span class="detail-value">+${item.points} pts</span>
                        <div class="detail-reason">${item.reason}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Emergency Flags
    if (analysis.scores.emergencyBonus > 0) {
        breakdownHTML += `
            <div class="breakdown-layer emergency-layer">
                <div class="layer-header">
                    <span class="layer-icon">🚨</span>
                    <span class="layer-title">Emergency Warning Signs</span>
                    <span class="layer-score">+${analysis.scores.emergencyBonus} pts</span>
                </div>
                <div class="layer-details">
                    ${analysis.detailedBreakdown.emergencyFlags.map(item => `
                        <div class="detail-item critical">
                            <span class="detail-label">${item.category}:</span>
                            <span class="detail-value">+${item.points} pts</span>
                            <div class="detail-reason">${item.reason}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    breakdownHTML += '</div>';
    riskBreakdown.innerHTML = breakdownHTML;
    
    // Display key factors
    let factorsHTML = '<div class="factors-list">';
    factorsHTML += '<h4>Key Risk Factors Identified:</h4>';
    analysis.factors.slice(0, 5).forEach(factor => {
        const severity = factor.includes('CRITICAL') ? 'critical' : factor.includes('URGENT') ? 'high' : 'moderate';
        factorsHTML += `<div class="factor-tag ${severity}">${factor}</div>`;
    });
    factorsHTML += '</div>';
    scoreFactors.innerHTML = factorsHTML;
}

// ========== SMART ROUTING PANEL ==========
function displayRoutingPanel(routing) {
    const routingPath = document.getElementById('routingPath');
    
    const routingHTML = `
        <div class="routing-card">
            <div class="routing-item">
                <div class="routing-label">🏥 Recommended Facility:</div>
                <div class="routing-value">${routing.destination}</div>
            </div>
            <div class="routing-item">
                <div class="routing-label">⏱️ Timeline:</div>
                <div class="routing-value">${routing.waitTime}</div>
            </div>
            <div class="routing-item">
                <div class="routing-label">🚗 Transportation:</div>
                <div class="routing-value">${routing.transportMethod}</div>
            </div>
            <div class="routing-action">
                <strong>Action Required:</strong> ${routing.action}
            </div>
        </div>
    `;
    
    routingPath.innerHTML = routingHTML;
}

// ========== RECOMMENDATIONS DISPLAY ==========
function displayRecommendations(recommendations) {
    const resultRecommendations = document.getElementById('resultRecommendations');
    
    let recsHTML = '<h3>📋 Detailed Recommendations</h3><ul class="recommendations-list">';
    recommendations.forEach(rec => {
        recsHTML += `<li>${rec}</li>`;
    });
    recsHTML += '</ul>';
    
    resultRecommendations.innerHTML = recsHTML;
}

// ==================== RESET FORM ====================
function resetForm() {
    const form = document.getElementById('triageForm');
    form.reset();
    currentStep = 1;
    updateFormUI();
    
    document.getElementById('triage').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    
    scrollToSection('triage');
}

// ==================== SORT PATIENT QUEUE ====================
function sortPatientQueue() {
    patientQueue.sort((a, b) => {
        // Sort by score (highest first)
        return b.totalScore - a.totalScore;
    });
}

// ==================== ENHANCED DOCTOR DASHBOARD ====================
function updateDashboard() {
    // Count by priority
    const emergencyCount = patientQueue.filter(p => p.priority === 'emergency').length;
    const urgentCount = patientQueue.filter(p => p.priority === 'urgent').length;
    const routineCount = patientQueue.filter(p => p.priority === 'routine').length;
    
    // Update stats
    document.getElementById('emergencyCount').textContent = emergencyCount;
    document.getElementById('urgentCount').textContent = urgentCount;
    document.getElementById('routineCount').textContent = routineCount;
    document.getElementById('totalCount').textContent = patientQueue.length;
    
    // Update table
    const tableBody = document.getElementById('dashboardTableBody');
    
    if (patientQueue.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #6B7280;">
                    No patients in queue. Complete a symptom assessment to add patients.
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = '';
    
    patientQueue.forEach(patient => {
        const row = document.createElement('tr');
        row.className = patient.priority;
        
        const symptomName = getSymptomName(patient.symptom);
        const timeAgo = getTimeAgo(patient.timestamp);
        
        // Context factors summary
        const contextSummary = patient.contextFactors.slice(0, 2).join('; ') || 'Standard risk profile';
        
        // Determine action buttons based on status
        let actionButtons = '';
        if (patient.status === PatientStatus.WAITING) {
            actionButtons = `
                <button class="action-button call-button" onclick="callPatientToCabin(${patient.id})" title="Call patient to cabin">
                    📞 Call to Cabin
                </button>
                <button class="action-button view-button" onclick="viewPatientDetails(${patient.id})" title="View full details">
                    👁️ View
                </button>
                <button class="action-button dismiss-button" onclick="dismissPatient(${patient.id})" title="Dismiss from queue">
                    ✕
                </button>
            `;
        } else if (patient.status === PatientStatus.CALLED_TO_CABIN) {
            actionButtons = `
                <button class="action-button start-button" onclick="startConsultation(${patient.id})">
                    ▶️ Start
                </button>
                <button class="action-button view-button" onclick="viewPatientDetails(${patient.id})">
                    👁️ View
                </button>
            `;
        } else if (patient.status === PatientStatus.IN_CONSULTATION) {
            actionButtons = `
                <button class="action-button complete-button" onclick="completeConsultation(${patient.id})">
                    ✓ Complete
                </button>
                <button class="action-button view-button" onclick="viewPatientDetails(${patient.id})">
                    👁️ View
                </button>
            `;
        }
        
        row.innerHTML = `
            <td>
                <div class="priority-cell">
                    <div class="priority-indicator ${patient.priority}"></div>
                    <span class="priority-text">${patient.priorityLevel}</span>
                </div>
            </td>
            <td>
                <strong>${patient.name}</strong>
                <br>${getStatusBadge(patient.status)}
            </td>
            <td>${patient.age} <small>(${patient.gender})</small></td>
            <td>${symptomName}</td>
            <td>
                <div class="score-badge ${patient.priority}">
                    ${patient.totalScore}/100
                </div>
            </td>
            <td>
                <div class="context-summary">
                    ${contextSummary}
                </div>
            </td>
            <td>${timeAgo}</td>
            <td>
                <div class="action-buttons-group">
                    ${actionButtons}
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// ==================== VIEW PATIENT DETAILS ====================
function viewPatientDetails(patientId) {
    const patient = patientQueue.find(p => p.id === patientId);
    if (!patient) return;
    
    // Create detailed modal overlay
    const modal = document.createElement('div');
    modal.className = 'patient-details-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
        overflow-y: auto;
        padding: 2rem;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideInUp 0.4s ease;
    `;
    
    // Get symptom name
    const symptomName = getSymptomName(patient.symptom);
    const severityText = ['Minimal', 'Mild', 'Moderate', 'Severe', 'Very Severe', 'Extreme', 'Worst Possible'];
    
    // Build comprehensive details HTML
    modalContent.innerHTML = `
        <div style="padding: 2rem;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem; border-bottom: 2px solid rgba(59, 130, 246, 0.2); padding-bottom: 1.5rem;">
                <div>
                    <h2 style="font-size: 2rem; font-weight: 800; color: #1E3A8A; margin: 0 0 0.5rem 0;">
                        ${patient.name}
                    </h2>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <span style="background: linear-gradient(135deg, #3B82F6, #2563EB); color: white; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;">
                            ${patient.age} years • ${patient.gender}
                        </span>
                        <span class="priority-badge ${patient.priority}" style="padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 700;">
                            ${patient.priorityLevel} - ${patient.totalScore}/100
                        </span>
                        ${getStatusBadge(patient.status)}
                    </div>
                </div>
                <button onclick="this.closest('.patient-details-modal').remove()" style="background: rgba(239, 68, 68, 0.1); color: #EF4444; border: none; padding: 0.75rem 1rem; border-radius: 12px; cursor: pointer; font-size: 1.25rem; font-weight: 700; transition: all 0.3s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'">
                    ✕ Close
                </button>
            </div>
            
            <!-- 9-Step Context-Aware Assessment -->
            <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.05)); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; border: 2px solid rgba(59, 130, 246, 0.2);">
                <h3 style="font-size: 1.5rem; font-weight: 700; color: #1E3A8A; margin: 0 0 1.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 2rem;">📋</span>
                    Context-Aware Assessment (9 Steps)
                </h3>
                
                <div style="display: grid; gap: 1rem;">
                    <!-- Step 1: Basic Information -->
                    <div class="assessment-step" style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-weight: 700; color: #3B82F6; margin-bottom: 0.75rem; font-size: 1rem;">
                            📝 Step 1: Basic Information
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                            <div>
                                <span style="color: #6B7280; font-size: 0.875rem;">Name:</span>
                                <div style="font-weight: 600; color: #1F2937;">${patient.name}</div>
                            </div>
                            <div>
                                <span style="color: #6B7280; font-size: 0.875rem;">Age:</span>
                                <div style="font-weight: 600; color: #1F2937;">${patient.age} years</div>
                            </div>
                            <div>
                                <span style="color: #6B7280; font-size: 0.875rem;">Gender:</span>
                                <div style="font-weight: 600; color: #1F2937;">${patient.gender}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Step 2: Primary Symptom -->
                    <div class="assessment-step" style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-weight: 700; color: #3B82F6; margin-bottom: 0.75rem; font-size: 1rem;">
                            🩺 Step 2: Primary Symptom
                        </div>
                        <div style="display: grid; gap: 0.75rem;">
                            <div>
                                <span style="color: #6B7280; font-size: 0.875rem;">Chief Complaint:</span>
                                <div style="font-weight: 600; color: #1F2937; font-size: 1.125rem;">${symptomName}</div>
                            </div>
                            <div>
                                <span style="color: #6B7280; font-size: 0.875rem;">Severity Level:</span>
                                <div style="font-weight: 600; color: ${patient.severity >= 7 ? '#EF4444' : patient.severity >= 4 ? '#F59E0B' : '#22C55E'};">
                                    ${patient.severity}/10 - ${severityText[Math.min(Math.floor(patient.severity / 1.5), 6)]}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Step 3: Symptom Duration -->
                    <div class="assessment-step" style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-weight: 700; color: #3B82F6; margin-bottom: 0.75rem; font-size: 1rem;">
                            ⏱️ Step 3: Symptom Duration & Onset
                        </div>
                        <div style="display: grid; gap: 0.75rem;">
                            <div>
                                <span style="color: #6B7280; font-size: 0.875rem;">Duration:</span>
                                <div style="font-weight: 600; color: #1F2937;">${patient.duration || 'Not specified'}</div>
                            </div>
                            <div>
                                <span style="color: #6B7280; font-size: 0.875rem;">Onset Type:</span>
                                <div style="font-weight: 600; color: #1F2937;">${patient.onset || 'Not specified'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Step 4: Pre-existing Conditions -->
                    <div class="assessment-step" style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-weight: 700; color: #3B82F6; margin-bottom: 0.75rem; font-size: 1rem;">
                            🏥 Step 4: Pre-existing Conditions
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${patient.conditions && patient.conditions.length > 0 ? 
                                patient.conditions.map(cond => `
                                    <span style="background: rgba(239, 68, 68, 0.1); color: #DC2626; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;">
                                        ${cond}
                                    </span>
                                `).join('') : 
                                '<span style="color: #6B7280; font-style: italic;">None reported</span>'
                            }
                        </div>
                    </div>
                    
                    <!-- Step 5: Current Medications -->
                    <div class="assessment-step" style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-weight: 700; color: #3B82F6; margin-bottom: 0.75rem; font-size: 1rem;">
                            💊 Step 5: Current Medications
                        </div>
                        <div>
                            ${patient.medications && patient.medications.trim() ? 
                                `<div style="font-weight: 600; color: #1F2937;">${patient.medications}</div>` : 
                                '<span style="color: #6B7280; font-style: italic;">None reported</span>'
                            }
                        </div>
                    </div>
                    
                    <!-- Step 6: Allergies -->
                    <div class="assessment-step" style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-weight: 700; color: #3B82F6; margin-bottom: 0.75rem; font-size: 1rem;">
                            ⚠️ Step 6: Allergies
                        </div>
                        <div>
                            ${patient.allergies && patient.allergies.trim() ? 
                                `<div style="font-weight: 600; color: #DC2626; background: rgba(239, 68, 68, 0.1); padding: 0.75rem; border-radius: 8px;">${patient.allergies}</div>` : 
                                '<span style="color: #6B7280; font-style: italic;">None reported</span>'
                            }
                        </div>
                    </div>
                    
                    <!-- Step 7: Symptom Progression -->
                    <div class="assessment-step" style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-weight: 700; color: #3B82F6; margin-bottom: 0.75rem; font-size: 1rem;">
                            📈 Step 7: Symptom Progression
                        </div>
                        <div>
                            <span style="color: #6B7280; font-size: 0.875rem;">Progression Pattern:</span>
                            <div style="font-weight: 600; color: ${patient.progression === 'worsening' ? '#EF4444' : patient.progression === 'stable' ? '#F59E0B' : '#22C55E'}; font-size: 1rem; margin-top: 0.25rem;">
                                ${patient.progression === 'worsening' ? '📉 Worsening (High Priority)' : 
                                  patient.progression === 'stable' ? '➡️ Stable (Monitor)' : 
                                  '📈 Improving (Low Priority)'}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Step 8: Emergency Warning Signs -->
                    <div class="assessment-step" style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-weight: 700; color: #3B82F6; margin-bottom: 0.75rem; font-size: 1rem;">
                            🚨 Step 8: Emergency Warning Signs
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${patient.emergencyFlags && patient.emergencyFlags.length > 0 ? 
                                patient.emergencyFlags.map(flag => `
                                    <span style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
                                        🚨 ${flag}
                                    </span>
                                `).join('') : 
                                '<span style="color: #22C55E; font-weight: 600;">✓ No emergency warning signs detected</span>'
                            }
                        </div>
                    </div>
                    
                    <!-- Step 9: Additional Notes -->
                    <div class="assessment-step" style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-weight: 700; color: #3B82F6; margin-bottom: 0.75rem; font-size: 1rem;">
                            📝 Step 9: Additional Notes
                        </div>
                        <div style="color: #1F2937; line-height: 1.6;">
                            ${patient.additionalNotes && patient.additionalNotes.trim() ? 
                                patient.additionalNotes : 
                                '<span style="color: #6B7280; font-style: italic;">No additional notes provided</span>'
                            }
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- AI Analysis & Explainability -->
            <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(124, 58, 237, 0.05)); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; border: 2px solid rgba(139, 92, 246, 0.2);">
                <h3 style="font-size: 1.5rem; font-weight: 700; color: #6B21A8; margin: 0 0 1.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 2rem;">🧠</span>
                    AI Analysis & Risk Score Breakdown
                </h3>
                
                <!-- Score Circle -->
                <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                    <div style="text-align: center;">
                        <div style="width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(${patient.priority === 'emergency' ? '#EF4444' : patient.priority === 'urgent' ? '#F59E0B' : '#22C55E'} ${patient.totalScore * 3.6}deg, rgba(209, 213, 219, 0.2) 0deg); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem;">
                            <div style="width: 100px; height: 100px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                                <div style="font-size: 2rem; font-weight: 800; color: ${patient.priority === 'emergency' ? '#EF4444' : patient.priority === 'urgent' ? '#F59E0B' : '#22C55E'};">${patient.totalScore}</div>
                                <div style="font-size: 0.75rem; color: #6B7280;">/ 100</div>
                            </div>
                        </div>
                        <div style="font-weight: 700; color: #1F2937;">Total Risk Score</div>
                    </div>
                    
                    <div style="flex: 1; min-width: 250px;">
                        <div style="margin-bottom: 1rem;">
                            <div style="font-size: 0.875rem; color: #6B7280; margin-bottom: 0.25rem;">Layer 1: Symptom Severity</div>
                            <div style="background: rgba(209, 213, 219, 0.2); border-radius: 8px; height: 24px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, #3B82F6, #2563EB); height: 100%; width: ${(patient.scores.symptomScore / 40) * 100}%; display: flex; align-items: center; justify-content: flex-end; padding-right: 0.5rem; color: white; font-size: 0.75rem; font-weight: 600;">${patient.scores.symptomScore}/40</div>
                            </div>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <div style="font-size: 0.875rem; color: #6B7280; margin-bottom: 0.25rem;">Layer 2: Patient Context</div>
                            <div style="background: rgba(209, 213, 219, 0.2); border-radius: 8px; height: 24px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, #8B5CF6, #7C3AED); height: 100%; width: ${(patient.scores.contextScore / 35) * 100}%; display: flex; align-items: center; justify-content: flex-end; padding-right: 0.5rem; color: white; font-size: 0.75rem; font-weight: 600;">${patient.scores.contextScore}/35</div>
                            </div>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <div style="font-size: 0.875rem; color: #6B7280; margin-bottom: 0.25rem;">Layer 3: Progression & Timing</div>
                            <div style="background: rgba(209, 213, 219, 0.2); border-radius: 8px; height: 24px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, #F59E0B, #D97706); height: 100%; width: ${(patient.scores.progressionScore / 15) * 100}%; display: flex; align-items: center; justify-content: flex-end; padding-right: 0.5rem; color: white; font-size: 0.75rem; font-weight: 600;">${patient.scores.progressionScore}/15</div>
                            </div>
                        </div>
                        ${patient.scores.emergencyBonus > 0 ? `
                        <div>
                            <div style="font-size: 0.875rem; color: #6B7280; margin-bottom: 0.25rem;">Emergency Bonus</div>
                            <div style="background: rgba(209, 213, 219, 0.2); border-radius: 8px; height: 24px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, #EF4444, #DC2626); height: 100%; width: ${(patient.scores.emergencyBonus / 10) * 100}%; display: flex; align-items: center; justify-content: flex-end; padding-right: 0.5rem; color: white; font-size: 0.75rem; font-weight: 600;">+${patient.scores.emergencyBonus}/10</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Key Risk Factors -->
                <div>
                    <div style="font-weight: 700; color: #6B21A8; margin-bottom: 0.75rem;">🎯 Key Risk Factors Identified:</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${patient.contextFactors && patient.contextFactors.length > 0 ? 
                            patient.contextFactors.map(factor => {
                                const severity = factor.includes('CRITICAL') ? 'critical' : factor.includes('complication') ? 'high' : 'moderate';
                                const bgColor = severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' : severity === 'high' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)';
                                const textColor = severity === 'critical' ? '#DC2626' : severity === 'high' ? '#D97706' : '#2563EB';
                                return `<span style="background: ${bgColor}; color: ${textColor}; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;">${factor}</span>`;
                            }).join('') : 
                            '<span style="color: #6B7280; font-style: italic;">No significant risk factors identified</span>'
                        }
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="display: flex; gap: 1rem; justify-content: flex-end; border-top: 2px solid rgba(59, 130, 246, 0.2); padding-top: 1.5rem;">
                ${patient.status === PatientStatus.WAITING ? `
                    <button onclick="callPatientToCabin(${patient.id}); this.closest('.patient-details-modal').remove();" style="background: linear-gradient(135deg, #22C55E, #16A34A); color: white; border: none; padding: 0.875rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(34, 197, 94, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(34, 197, 94, 0.3)'">
                        📞 Call to Cabin
                    </button>
                ` : patient.status === PatientStatus.CALLED_TO_CABIN ? `
                    <button onclick="startConsultation(${patient.id}); this.closest('.patient-details-modal').remove();" style="background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; border: none; padding: 0.875rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(139, 92, 246, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(139, 92, 246, 0.3)'">
                        ▶️ Start Consultation
                    </button>
                ` : patient.status === PatientStatus.IN_CONSULTATION ? `
                    <button onclick="completeConsultation(${patient.id}); this.closest('.patient-details-modal').remove();" style="background: linear-gradient(135deg, #3B82F6, #2563EB); color: white; border: none; padding: 0.875rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(59, 130, 246, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.3)'">
                        ✓ Complete Consultation
                    </button>
                ` : ''}
                <button onclick="this.closest('.patient-details-modal').remove()" style="background: rgba(107, 114, 128, 0.1); color: #4B5563; border: none; padding: 0.875rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 1rem; transition: all 0.3s;" onmouseover="this.style.background='rgba(107, 114, 128, 0.2)'" onmouseout="this.style.background='rgba(107, 114, 128, 0.1)'">
                    Close
                </button>
            </div>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ==================== DOCTOR NOTIFICATION SYSTEM ====================
function notifyDoctor(patient) {
    if (!doctorNotificationsEnabled) return;
    
    // Play alert sound for emergency cases
    if (patient.priority === 'emergency') {
        playAlertSound();
    }
    
    // Show urgent notification
    showDoctorNotification(patient);
    
    // Flash browser title for attention
    if (patient.priority === 'emergency' || patient.priority === 'urgent') {
        flashBrowserTitle(patient);
    }
}

function showDoctorNotification(patient) {
    const notification = document.createElement('div');
    notification.className = `doctor-notification ${patient.priority}`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        max-width: 400px;
        background: ${patient.priority === 'emergency' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 
                      patient.priority === 'urgent' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 
                      'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'};
        color: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        animation: slideInBounce 0.5s ease;
    `;
    
    const urgencyIcon = patient.priority === 'emergency' ? '🚨' : 
                       patient.priority === 'urgent' ? '⚠️' : '✓';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 1rem;">
            <div style="font-size: 2.5rem;">${urgencyIcon}</div>
            <div style="flex: 1;">
                <div style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">
                    ${patient.priority.toUpperCase()} PATIENT
                </div>
                <div style="font-size: 1rem; margin-bottom: 0.5rem;">
                    <strong>${patient.name}</strong> (${patient.age} yrs)
                </div>
                <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 1rem;">
                    ${getSymptomName(patient.symptom)} | Score: ${patient.totalScore}/100
                    <br>${patient.contextFactors.slice(0, 1).join('')}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="callPatientToCabin(${patient.id}); this.closest('.doctor-notification').remove();" 
                            style="flex: 1; background: white; color: #1E3A8A; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        📞 Call to Cabin
                    </button>
                    <button onclick="this.closest('.doctor-notification').remove();" 
                            style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                        ✕
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 15 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 15000);
}

function playAlertSound() {
    // Create audio context for alert sound
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // Second beep
        setTimeout(() => {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 1000;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            osc2.start(audioContext.currentTime);
            osc2.stop(audioContext.currentTime + 0.5);
        }, 600);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function flashBrowserTitle(patient) {
    const originalTitle = document.title;
    let flashCount = 0;
    const maxFlashes = 10;
    
    const flashInterval = setInterval(() => {
        document.title = flashCount % 2 === 0 ? 
            `🚨 ${patient.priority.toUpperCase()} - ${patient.name}` : 
            originalTitle;
        flashCount++;
        
        if (flashCount >= maxFlashes) {
            clearInterval(flashInterval);
            document.title = originalTitle;
        }
    }, 1000);
}

// ==================== PATIENT MANAGEMENT ACTIONS ====================
function callPatientToCabin(patientId) {
    const patient = patientQueue.find(p => p.id === patientId);
    if (!patient) return;
    
    // Update patient status
    patient.status = PatientStatus.CALLED_TO_CABIN;
    patient.calledAt = new Date();
    
    // Show success message
    showNotification(`✓ ${patient.name} has been called to cabin`, 'success');
    
    // Update dashboard
    updateDashboard();
    
    // Show patient notification (simulate)
    showPatientCallNotification(patient);
}

function startConsultation(patientId) {
    const patient = patientQueue.find(p => p.id === patientId);
    if (!patient) return;
    
    patient.status = PatientStatus.IN_CONSULTATION;
    patient.consultationStarted = new Date();
    
    showNotification(`Consultation started with ${patient.name}`, 'info');
    updateDashboard();
}

function completeConsultation(patientId) {
    const patient = patientQueue.find(p => p.id === patientId);
    if (!patient) return;
    
    patient.status = PatientStatus.COMPLETED;
    patient.completedAt = new Date();
    
    showNotification(`Consultation completed for ${patient.name}`, 'success');
    
    // Remove from active queue after 5 seconds
    setTimeout(() => {
        const index = patientQueue.findIndex(p => p.id === patientId);
        if (index > -1) {
            patientQueue.splice(index, 1);
            updateDashboard();
        }
    }, 5000);
    
    updateDashboard();
}

function dismissPatient(patientId) {
    const patient = patientQueue.find(p => p.id === patientId);
    if (!patient) return;
    
    if (confirm(`Are you sure you want to dismiss ${patient.name} from the queue?`)) {
        const index = patientQueue.findIndex(p => p.id === patientId);
        if (index > -1) {
            patientQueue.splice(index, 1);
            showNotification(`${patient.name} dismissed from queue`, 'info');
            updateDashboard();
        }
    }
}

function showPatientCallNotification(patient) {
    // This simulates sending notification to patient
    // In real system, this would be WebSocket/API call
    const patientNotif = document.createElement('div');
    patientNotif.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        max-width: 350px;
        background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        animation: slideInLeft 0.5s ease;
    `;
    
    patientNotif.innerHTML = `
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📱 Patient Portal Notification</div>
        <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">
            ${patient.name}, please proceed to doctor's cabin
        </div>
        <div style="font-size: 0.875rem; opacity: 0.9;">
            Your consultation is ready. Please head to the cabin immediately.
        </div>
    `;
    
    document.body.appendChild(patientNotif);
    
    setTimeout(() => {
        if (patientNotif.parentNode) {
            patientNotif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => patientNotif.remove(), 300);
        }
    }, 8000);
}

function getStatusBadge(status) {
    const badges = {
        [PatientStatus.WAITING]: '<span class="status-badge waiting">⏳ Waiting</span>',
        [PatientStatus.CALLED_TO_CABIN]: '<span class="status-badge called">📞 Called</span>',
        [PatientStatus.IN_CONSULTATION]: '<span class="status-badge consulting">👨‍⚕️ In Consultation</span>',
        [PatientStatus.COMPLETED]: '<span class="status-badge completed">✓ Completed</span>'
    };
    return badges[status] || badges[PatientStatus.WAITING];
}

// ==================== HELPER FUNCTIONS ====================
function getSymptomName(symptomCode) {
    const symptoms = {
        'chest-pain': 'Chest Pain',
        'breathing-difficulty': 'Breathing Difficulty',
        'severe-headache': 'Severe Headache',
        'abdominal-pain': 'Abdominal Pain',
        'fever': 'Fever',
        'dizziness': 'Dizziness',
        'injury': 'Injury/Trauma',
        'allergic-reaction': 'Allergic Reaction',
        'nausea': 'Nausea/Vomiting',
        'cough': 'Persistent Cough',
        'bleeding': 'Severe Bleeding',
        'confusion': 'Confusion',
        'other': 'Other'
    };
    return symptoms[symptomCode] || symptomCode;
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? '#EF4444' : type === 'success' ? '#22C55E' : '#3B82F6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ==================== SCROLL ANIMATIONS ====================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    const animateElements = document.querySelectorAll('.work-card, .dashboard-stat-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ==================== GENERATE SAMPLE DATA ====================
function generateSampleData() {
    const samplePatients = [
        {
            name: 'John Smith',
            age: '68',
            gender: 'male',
            symptom: 'chest-pain',
            severity: '9',
            duration: 'less-1-hour',
            progression: 'worsening',
            conditions: ['heart-disease', 'hypertension'],
            emergencyFlags: ['chest-pain-radiating'],
            medications: 'Aspirin, Metoprolol',
            timestamp: new Date(Date.now() - 1800000)
        },
        {
            name: 'Sarah Johnson',
            age: '32',
            gender: 'female',
            symptom: 'fever',
            severity: '6',
            duration: '1-3-days',
            progression: 'stable',
            conditions: ['none'],
            emergencyFlags: ['none'],
            medications: '',
            timestamp: new Date(Date.now() - 3600000)
        },
        {
            name: 'Michael Brown',
            age: '45',
            gender: 'male',
            symptom: 'cough',
            severity: '4',
            duration: '3-7-days',
            progression: 'improving',
            conditions: ['asthma'],
            emergencyFlags: ['none'],
            medications: 'Albuterol inhaler',
            timestamp: new Date(Date.now() - 7200000)
        }
    ];
    
    samplePatients.forEach((patientData, index) => {
        const analysis = analyzeSymptoms(patientData);
        const patient = {
            ...patientData,
            ...analysis,
            id: Date.now() + Math.random(),
            status: index === 0 ? PatientStatus.WAITING : index === 1 ? PatientStatus.WAITING : PatientStatus.WAITING,
            submittedAt: patientData.timestamp,
            calledAt: null,
            consultationStarted: null,
            completedAt: null
        };
        patientQueue.push(patient);
    });
    
    sortPatientQueue();
    updateDashboard();
}

// ==================== CHECKBOX LOGIC ====================
document.addEventListener('DOMContentLoaded', () => {
    // "None" checkbox logic for conditions
    const conditionCheckboxes = document.querySelectorAll('input[name="conditions"]');
    const noneCondition = Array.from(conditionCheckboxes).find(cb => cb.value === 'none');
    
    if (noneCondition) {
        conditionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox === noneCondition && checkbox.checked) {
                    conditionCheckboxes.forEach(cb => {
                        if (cb !== noneCondition) cb.checked = false;
                    });
                } else if (checkbox !== noneCondition && checkbox.checked) {
                    noneCondition.checked = false;
                }
            });
        });
    }
    
    // "None" checkbox logic for emergency flags
    const emergencyCheckboxes = document.querySelectorAll('input[name="emergencyFlags"]');
    const noneEmergency = Array.from(emergencyCheckboxes).find(cb => cb.value === 'none');
    
    if (noneEmergency) {
        emergencyCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox === noneEmergency && checkbox.checked) {
                    emergencyCheckboxes.forEach(cb => {
                        if (cb !== noneEmergency) cb.checked = false;
                    });
                } else if (checkbox !== noneEmergency && checkbox.checked) {
                    noneEmergency.checked = false;
                }
            });
        });
    }
});

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize particle animation
    initParticles();
    
    // Initialize navigation
    updateNavigation();
    
    // Initialize severity slider
    initSeveritySlider();
    
    // Initialize form
    updateFormUI();
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Form submission
    const form = document.getElementById('triageForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Generate sample data
    generateSampleData();
    
    // Update dashboard
    updateDashboard();
    
    console.log('🏥 SmartTriage AI - Context-Aware System Initialized!');
    console.log('✓ 3-Layer AI Architecture Active');
    console.log('✓ Explainable Intelligence Enabled');
    console.log('✓ Smart Routing Configured');
});

// Export functions for global access
window.scrollToSection = scrollToSection;
window.changeStep = changeStep;
window.resetForm = resetForm;
window.viewPatientDetails = viewPatientDetails;
window.callPatientToCabin = callPatientToCabin;
window.startConsultation = startConsultation;
window.completeConsultation = completeConsultation;
window.dismissPatient = dismissPatient;
