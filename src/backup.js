/* global __initial_auth_token, __app_id */
// src/App.js - Consolidated React Application with Firebase Integration

import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import Chart from 'chart.js/auto'; // Import Chart.js

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';


// --- Global App ID for Local Development (ESLint Fix) ---
// In Canvas, __app_id is provided globally. For local development, we define it here.
const LOCAL_APP_ID = 'nyza-skill-tracker-local';

// --- 0. CONSTANTS ---
const MATRICES = {
    ROLE_WEIGHTS: {
        "Mechanical Engineer": { M: 0.60, E: 0.10, S: 0.10, B: 0.20, PM: 0.20, TIME: 0.60 },
        "Electrical Engineer": { M: 0.10, E: 0.60, S: 0.10, B: 0.20, PM: 0.20, TIME: 0.60 },
        "Robotics Software Engineer": { M: 0.10, E: 0.10, S: 0.60, B: 0.20, PM: 0.20, TIME: 0.60 },
        "Mechatronics Engineer": { M: 0.40, E: 0.40, S: 0.20, B: 0.20, PM: 0.20, TIME: 0.60 },
        "Robotics Engineer (All-rounder)": { M: 0.25, E: 0.25, S: 0.25, B: 0.25, PM: 0.20, TIME: 0.60 },
        "Business Development Executive": { M: 0.10, E: 0.10, S: 0.10, B: 0.70, PM: 0.20, TIME: 0.60 }
    },
    SCORE_LEVEL_MAP: [
        { min: 61, max: 80, level: "Project Manager or Lead Engineer", pmSkill: "Very High" },
        { min: 53, max: 60, level: "Senior Engineer", pmSkill: "High" },
        { min: 39, max: 52, level: "Graduate-Level Engineer", pmSkill: "Moderate" },
        { min: 25, max: 38, level: "Junior Engineer", pmSkill: "Moderate" },
        { min: 0, max: 24, level: "Assistant Engineer", pmSkill: "Low" }
    ],
    LEVEL_TIME_MAP: {
        "Assistant Engineer": { min: 1.5, max: 2 },
        "Junior Engineer": { min: 1.5, max: 2 },
        "Engineer": { min: 2, max: 3 },
        "Senior Engineer": { min: 2, max: 3 },
        "Project Manager": { min: 2, max: 3 }
    }
};

const SKILLS_DATA = [
    {
        category: "Robotics - Mechanical",
        matrixCategory: "M",
        skills: [
            { name: "Sketching + CAD Design", maxScore: 20 },
            { name: "3D Printing & Fabrication", maxScore: 20 },
            { name: "Material Selection", maxScore: 20 },
            { name: "Mechanism Design", maxScore: 20 },
            { name: "Technical Drawing / BOM", maxScore: 20 }
        ]
    },
    {
        category: "Robotics - Electronics",
        matrixCategory: "E",
        skills: [
            { name: "Schematic Design", maxScore: 20 },
            { name: "PCB Design", maxScore: 20 },
            { name: "Embedded Systems Programming", maxScore: 20 },
            { name: "Sensor Integration", maxScore: 20 },
            { name: "Power Systems & Safety", maxScore: 20 }
        ]
    },
    {
        category: "Robotics - Software",
        matrixCategory: "S",
        skills: [
            { name: "ROS & Robot Control", maxScore: 20 },
            { name: "SLAM & Navigation", maxScore: 20 },
            { name: "Computer Vision (OpenCV/AI)", maxScore: 20 },
            { name: "Simulation (Gazebo/Isaac Sim)", maxScore: 20 },
            { name: "System Integration & Testing", maxScore: 20 }
        ]
    },
    {
        category: "Business Skills",
        matrixCategory: "B",
        skills: [
            { name: "Lead Generation, Profiling", maxScore: 20 },
            { name: "Marketing & Branding", maxScore: 20 },
            { name: "Sales Strategy, Writing, Convincing", maxScore: 20 },
            { name: "Accounting & Finance", maxScore: 20 }
        ]
    },
    {
        category: "Team & Project Management",
        matrixCategory: "PM",
        skills: [
            { name: "Team & Project Management", maxScore: 20 }
        ]
    }
];

// Dummy data creation (will be replaced by Firebase data)
const createDummyData = () => {
    const dummyEmployees = [
        {
            id: 'emp1',
            fullName: 'Arnab (Dummy)', // Changed to fullName
            username: 'arnab', // New username field
            role: 'Robotics Software Engineer',
            timeAtRole: 2.1,
            totalYearsInCompany: 2.1,
            currentLevel: 'Junior Engineer',
            skills: SKILLS_DATA.map(cat => ({
                category: cat.category,
                matrixCategory: cat.matrixCategory,
                skills: cat.skills.map(skill => ({
                    name: skill.name,
                    maxScore: skill.maxScore,
                    score: Math.floor(Math.random() * (skill.maxScore + 1)),
                    last6MonthsScore: Math.floor(Math.random() * (skill.maxScore + 1)),
                    tasks: [
                        { id: 'task1a', name: 'Revise Survell Embedded', description: 'Complete a deep dive into Survell Embedded systems.', points: 2, status: 'approved', priority: 'High' },
                        { id: 'task1b', name: 'Doing a hobby project', description: 'Work on a personal robotics hobby project.', points: 3, status: 'pending', priority: 'Medium' }
                    ]
                }))
            })),
        },
        {
            id: 'emp2',
            fullName: 'Bina (Dummy)', // Changed to fullName
            username: 'bina', // New username field
            role: 'Mechanical Engineer',
            timeAtRole: 3.5,
            totalYearsInCompany: 3.5,
            currentLevel: 'Senior Engineer',
            skills: SKILLS_DATA.map(cat => ({
                category: cat.category,
                matrixCategory: cat.matrixCategory,
                skills: cat.skills.map(skill => ({
                    name: skill.name,
                    maxScore: skill.maxScore,
                    score: Math.floor(Math.random() * (skill.maxScore + 1)),
                    last6MonthsScore: Math.floor(Math.random() * (skill.maxScore + 1)),
                    tasks: [
                        { id: 'task2a', name: 'Design new chassis', description: 'Design a lightweight chassis for the new robot.', points: 5, status: 'pending', priority: 'High' }
                    ]
                }))
            })),
        },
        {
            id: 'emp3',
            fullName: 'Chandan (Dummy)', // Changed to fullName
            username: 'chandan', // New username field
            role: 'Electrical Engineer',
            timeAtRole: 1.2,
            totalYearsInCompany: 1.2,
            currentLevel: 'Assistant Engineer',
            skills: SKILLS_DATA.map(cat => ({
                category: cat.category,
                matrixCategory: cat.matrixCategory,
                skills: cat.skills.map(skill => ({
                    name: skill.name,
                    maxScore: skill.maxScore,
                    score: Math.floor(Math.random() * (skill.maxScore + 1)),
                    last6MonthsScore: Math.floor(Math.random() * (skill.maxScore + 1)),
                    tasks: [
                        { id: 'task3a', name: 'PCB layout review', description: 'Review and approve the PCB layout for power module.', points: 3, status: 'pending', priority: 'Medium' }
                    ]
                }))
            })),
        }
    ];
    // Recalculate calculatedData for dummy employees on load (as it's not persisted)
    return dummyEmployees.map(emp => {
        const calculated = calculateSkillScores(emp);
        calculated.levelData = getLevelAndPMRating(calculated.totalScore);
        calculated.bestFitRole = determineBestFitRole(emp, calculated);
        return { ...emp, calculatedData: calculated };
    });
};


// --- PASSWORD HASHING UTILITY (FOR DEMO PURPOSES ONLY - NOT SECURE FOR PRODUCTION) ---
// In a real application, password hashing should ALWAYS be done on a secure backend server.
const hashPassword = (password) => {
    // For demonstration, we'll use Base64 encoding.
    // This is NOT a secure hashing algorithm for production environments.
    // A real application would use a strong, salted, adaptive hash function like bcrypt.
    return btoa(password); // Base64 encode
};

const verifyPassword = (plainPassword, hashedPassword) => {
    return hashPassword(plainPassword) === hashedPassword;
};


// --- 1. CALCULATION FUNCTIONS ---

const calculateSkillScores = (employee) => {
    const roleWeights = MATRICES.ROLE_WEIGHTS[employee.role];
    if (!roleWeights) {
        console.warn(`Role weights not found for role: ${employee.role}`);
        return { subTotals: {}, totalScore: 0, categoryPercentages: {} };
    }

    let subTotals = {};
    let totalScore = 0;
    let categoryPercentages = {};

    SKILLS_DATA.forEach(skillCategory => {
        let categoryRawScore = 0;
        let categoryMaxPossibleScore = 0;

        const employeeSkillCategory = employee.skills.find(sc => sc.category === skillCategory.category);

        if (employeeSkillCategory) {
            employeeSkillCategory.skills.forEach(skill => {
                const employeeSkill = employeeSkillCategory.skills.find(s => s.name === skill.name);
                if (employeeSkill) {
                    categoryRawScore += employeeSkill.score;
                    categoryMaxPossibleScore += skill.maxScore;
                }
            });
        }
       
        subTotals[skillCategory.category] = categoryRawScore;

        const matrixCategoryKey = skillCategory.matrixCategory;
        const weight = roleWeights[matrixCategoryKey] || 0;

        const categoryAchievedPercentage = categoryMaxPossibleScore > 0 
            ? (categoryRawScore / categoryMaxPossibleScore)
            : 0;
        
        totalScore += categoryAchievedPercentage * weight * 100;

        categoryPercentages[matrixCategoryKey] = categoryAchievedPercentage;
    });

    totalScore = Math.min(totalScore, 80); // Cap at 80 based on SCORE_LEVEL_MAP.

    return { subTotals, totalScore: parseFloat(totalScore.toFixed(2)), categoryPercentages };
};

const getLevelAndPMRating = (totalScore) => {
    for (const range of MATRICES.SCORE_LEVEL_MAP) {
        if (totalScore >= range.min && totalScore <= range.max) {
            return { level: range.level, pmSkill: range.pmSkill };
        }
    }
    return { level: "N/A", pmSkill: "N/A" };
};

const determineBestFitRole = (employee, calculatedData) => {
    const employeeCategoryPercs = calculatedData.categoryPercentages;
    let bestMatchRole = "N/A";
    let minDeviation = Infinity;

    for (const roleName in MATRICES.ROLE_WEIGHTS) {
        if (MATRICES.ROLE_WEIGHTS.hasOwnProperty(roleName)) {
            const idealRoleWeights = MATRICES.ROLE_WEIGHTS[roleName];
            let currentDeviation = 0;

            const relevantCategories = Array.from(new Set([
                ...Object.keys(employeeCategoryPercs),
                ...Object.keys(idealRoleWeights)
            ]));

            relevantCategories.forEach(categoryKey => {
                if (categoryKey === 'TIME') return;

                const employeeActualScaled = (employeeCategoryPercs[categoryKey] || 0) * 100;
                const roleIdealScaled = (idealRoleWeights[categoryKey] || 0) * 100;

                currentDeviation += Math.abs(employeeActualScaled - roleIdealScaled);
            });

            if (currentDeviation < minDeviation) {
                minDeviation = currentDeviation;
                bestMatchRole = roleName;
            }
        }
    }
    return bestMatchRole;
};

// Modified getCompanySkillDistribution to return raw sums and max possible sums
const getCompanySkillDistribution = (employees) => {
    const aggregatedRawScores = {
        M: 0,
        E: 0,
        S: 0,
        B: 0,
        PM: 0
    };
    const aggregatedMaxPossibleScores = {
        M: 0,
        E: 0,
        S: 0,
        B: 0,
        PM: 0
    };

    employees.forEach(employee => {
        SKILLS_DATA.forEach(skillCategory => {
            const matrixCategoryKey = skillCategory.matrixCategory;
            
            let categoryRawScore = 0;
            let categoryMaxPossibleScore = 0;

            const employeeSkillCategory = employee.skills.find(sc => sc.category === skillCategory.category);
            if (employeeSkillCategory) {
                employeeSkillCategory.skills.forEach(skill => {
                    categoryRawScore += skill.score;
                    categoryMaxPossibleScore += skill.maxScore;
                });
            }
            aggregatedRawScores[matrixCategoryKey] += categoryRawScore;
            aggregatedMaxPossibleScores[matrixCategoryKey] += categoryMaxPossibleScore;
        });
    });

    return { aggregatedRawScores, aggregatedMaxPossibleScores };
};

// --- 2. CONTEXT ---

const SkillTrackerContext = createContext();

const useSkillTracker = () => {
    return useContext(SkillTrackerContext);
};

const SkillTrackerProvider = ({ children }) => {
    const [currentUserRole, setCurrentUserRole] = useState(null); // No initial role, determined by Firebase Auth
    const [employees, setEmployees] = useState([]);
    const [archivedEmployees, setArchivedEmployees] = useState([]); // New state for archived employees
    const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
    const [currentPage, setCurrentPage] = useState('login'); // Start at login page

    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null); // Firebase UID
    const [isAuthReady, setIsAuthReady] = useState(false); // To track if auth state is resolved

    // --- START: Firebase Configuration for Local Development ---
    // This is the configuration you provided.
    const firebaseConfig = {
      apiKey: "AIzaSyBBer8TYgR0Fz5awRkq87XZZESvRRulXJg",
      authDomain: "nyza-skill-tracker.firebaseapp.com",
      projectId: "nyza-skill-tracker",
      storageBucket: "nyza-skill-tracker.firebasestorage.app",
      messagingSenderId: "68269769502",
      appId: "1:68269769502:web:d16c21b6194aff4fba3f0f",
      measurementId: "G-1TW5QSH7S5" // measurementId is optional for basic use
    };

    // Determine the actual appId to use (Canvas global or local constant)
    const currentAppId = typeof __app_id !== 'undefined' ? __app_id : LOCAL_APP_ID;
    // --- END: Firebase Configuration for Local Development ---

    // Firebase Initialization and Auth State Listener
    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);

            setDb(firestoreDb);
            setAuth(firebaseAuth);

            const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    // The role will be set by handleLogin based on what the user selects.
                } else {
                    // If no user is logged in, try to sign in with custom token or anonymously
                    try {
                        // __initial_auth_token is provided by Canvas. If running locally, it's undefined.
                        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                            await signInWithCustomToken(firebaseAuth, __initial_auth_token);
                        } else {
                            await signInAnonymously(firebaseAuth);
                        }
                    } catch (anonError) {
                        console.error("Anonymous or custom token sign-in failed:", anonError);
                        // If even anonymous sign-in fails, userId will remain null
                    }
                    // Ensure userId is set even for anonymous users or if auth fails
                    setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID()); 
                }
                setIsAuthReady(true); // Auth state is now determined
            });

            return () => unsubscribe(); // Cleanup auth listener
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            alert("Failed to initialize Firebase. Check console for details.");
        }
    }, []); // Run only once on component mount

    // Fetch employees from Firestore
    useEffect(() => {
        // Only proceed if db, currentAppId are available, and there's an authenticated user
        // auth.currentUser is a more reliable check than userId alone for Firestore rules
        if (!db || !currentAppId || !isAuthReady || !auth.currentUser) {
            // If we are unauthenticated, ensure data is cleared to prevent stale display
            if (employees.length > 0) setEmployees([]);
            if (archivedEmployees.length > 0) setArchivedEmployees([]);
            return;
        }

        const employeesCollectionRef = collection(db, `artifacts/${currentAppId}/public/data/employees`);
        const archivedEmployeesCollectionRef = collection(db, `artifacts/${currentAppId}/public/data/archivedEmployees`);

        // Listener for active employees
        const unsubscribeEmployees = onSnapshot(employeesCollectionRef, (snapshot) => {
            const fetchedEmployees = snapshot.docs.map(doc => {
                const data = doc.data();
                // Ensure calculatedData is fully populated here
                const calculated = calculateSkillScores({ id: doc.id, ...data });
                calculated.levelData = getLevelAndPMRating(calculated.totalScore);
                calculated.bestFitRole = determineBestFitRole({ id: doc.id, ...data }, calculated);

                const employee = {
                    id: doc.id,
                    ...data,
                    calculatedData: calculated // Assign the complete calculated data
                };
                if (!employee.currentLevel) employee.currentLevel = getLevelAndPMRating(0).level;
                if (employee.totalYearsInCompany === undefined) employee.totalYearsInCompany = employee.timeAtRole || 0;
                return employee;
            });
            console.log("onSnapshot: Fetched active employees:", fetchedEmployees); // Added console log
            setEmployees(fetchedEmployees);
        }, (error) => {
            console.error("Error fetching active employee data:", error);
            // alert("Error fetching employee data."); // Removed alert
        });

        // Listener for archived employees
        const unsubscribeArchived = onSnapshot(archivedEmployeesCollectionRef, (snapshot) => {
            const fetchedArchived = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log("onSnapshot: Fetched archived employees:", fetchedArchived); // Added console log
            setArchivedEmployees(fetchedArchived);
        }, (error) => {
            console.error("Error fetching archived employee data:", error);
            // alert("Error fetching archived employee data."); // Removed alert
        });

        return () => {
            unsubscribeEmployees();
            unsubscribeArchived();
        }; // Cleanup listeners
    }, [db, isAuthReady, auth, currentAppId]); // Dependencies for re-running fetch

    // Modified handleLogin to use Firebase Authentication for Admin, and Firestore for Employee
    const handleLogin = useCallback(async (role, username, password) => {
        if (!auth || !db) {
            alert("Firebase services not initialized.");
            return;
        }

        // IMPORTANT: Wait for authentication to be ready before making Firestore calls
        // This ensures request.auth is populated when security rules are evaluated.
        if (!isAuthReady) {
            alert("Authentication is not ready yet. Please try again in a moment.");
            return;
        }

        try {
            if (role === 'admin') {
                // Admin login uses Firebase Email/Password Auth
                await signInWithEmailAndPassword(auth, username, password);
                setCurrentUserRole('admin');
                setCurrentPage('admin');
            } else if (role === 'employee') {
                // Employee login uses custom credentials stored in Firestore
                // Ensure userId is available (from anonymous or custom token auth) for the query
                if (!userId) {
                    alert("User not authenticated for employee login. Please ensure anonymous sign-in is enabled.");
                    return;
                }

                // Query by username instead of name for employee login
                const q = query(collection(db, `artifacts/${currentAppId}/public/data/employees`), where("username", "==", username));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    alert("Employee not found or incorrect username.");
                    return;
                }

                const employeeDoc = querySnapshot.docs[0];
                const employeeData = employeeDoc.data();

                if (verifyPassword(password, employeeData.hashedPassword)) {
                    setCurrentUserRole('employee');
                    setCurrentEmployeeId(employeeDoc.id);
                    setCurrentPage('my-progress');
                } else {
                    alert("Incorrect password for employee.");
                }
            }
        } catch (error) {
            console.error("Login failed:", error.message);
            alert(`Login failed: ${error.message}`);
            setCurrentUserRole(null);
            setCurrentPage('login');
        }
    }, [auth, db, currentAppId, isAuthReady, userId]); // Added isAuthReady and userId to dependencies

    const handleLogout = useCallback(async () => {
        try {
            if (auth) {
                await signOut(auth);
            }
            setCurrentUserRole(null);
            setCurrentEmployeeId(null);
            setCurrentPage('login');
            // Clear employee data immediately on logout to prevent stale displays and potential errors
            setEmployees([]);
            setArchivedEmployees([]);
        } catch (error) {
            console.error("Logout failed:", error.message);
            alert(`Logout failed: ${error.message}`);
        }
    }, [auth]); // Added 'auth' as dependency

    // CRUD Operations using Firestore
    const addEmployee = useCallback(async (fullName, username, role, timeAtRole, employeePassword) => {
        if (!db || !userId) {
            alert("Database not ready or user not authenticated.");
            return;
        }
        try {
            // Check if username already exists
            const q = query(collection(db, `artifacts/${currentAppId}/public/data/employees`), where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                alert(`Employee with username '${username}' already exists. Please use a unique username.`);
                return;
            }

            const newEmployeeData = {
                fullName: fullName, // Store full name
                username: username, // Store username
                role: role,
                timeAtRole: timeAtRole,
                totalYearsInCompany: timeAtRole,
                currentLevel: getLevelAndPMRating(0).level,
                skills: SKILLS_DATA.map(cat => ({
                    category: cat.category,
                    matrixCategory: cat.matrixCategory,
                    skills: cat.skills.map(skill => ({
                        name: skill.name,
                        maxScore: skill.maxScore,
                        score: 0,
                        last6MonthsScore: 0,
                        tasks: []
                    }))
                })),
                hashedPassword: hashPassword(employeePassword) // Store hashed password
            };
            await addDoc(collection(db, `artifacts/${currentAppId}/public/data/employees`), newEmployeeData);
            // Add a small delay before the alert to allow onSnapshot to update
            setTimeout(() => {
                alert(`${fullName} added successfully!`);
            }, 500); // 500ms delay
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("Error adding employee.");
        }
    }, [db, userId, currentAppId]); // Added currentAppId to dependencies

    const updateEmployee = useCallback(async (updatedEmployee) => {
        if (!db || !userId) {
            alert("Database not ready or user not authenticated.");
            return;
        }
        try {
            // currentAppId is accessible from the outer scope of SkillTrackerProvider
            const { calculatedData, ...dataToSave } = updatedEmployee;
            await setDoc(doc(db, `artifacts/${currentAppId}/public/data/employees`, updatedEmployee.id), dataToSave);
            // onSnapshot listener will automatically update the local 'employees' state
        } catch (e) {
            console.error("Error updating document: ", e);
            alert("Error updating employee.");
        }
    }, [db, userId, currentAppId]); // Added currentAppId to dependencies

    const updateEmployeeCredentials = useCallback(async (employeeId, newFullName, newUsername, newPassword) => {
        if (!db || !userId) {
            alert("Database not ready or user not authenticated.");
            return;
        }
        try {
            // Check for username uniqueness if the username is being changed
            const currentEmployee = employees.find(emp => emp.id === employeeId);
            if (currentEmployee && currentEmployee.username !== newUsername) {
                const q = query(collection(db, `artifacts/${currentAppId}/public/data/employees`), where("username", "==", newUsername));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    alert(`Employee with username '${newUsername}' already exists. Please use a unique username.`);
                    return;
                }
            }

            const employeeRef = doc(db, `artifacts/${currentAppId}/public/data/employees`, employeeId);
            const updates = { fullName: newFullName, username: newUsername }; // Update full name and username
            if (newPassword) {
                updates.hashedPassword = hashPassword(newPassword); // Update hashed password if provided
            }
            await updateDoc(employeeRef, updates);
            alert('Employee credentials updated successfully!');
        } catch (e) {
            console.error("Error updating employee credentials: ", e);
            alert("Error updating employee credentials.");
        }
    }, [db, userId, currentAppId, employees]); // Added employees to dependencies for name uniqueness check


    const archiveEmployee = useCallback(async (employeeId) => {
        if (!db || !userId) {
            alert("Database not ready or user not authenticated.");
            return;
        }
        if (window.confirm(`Are you sure you want to archive this employee?`)) {
            try {
                const employeeRef = doc(db, `artifacts/${currentAppId}/public/data/employees`, employeeId);
                const employeeDoc = await getDocs(query(collection(db, `artifacts/${currentAppId}/public/data/employees`), where("__name__", "==", employeeId)));

                if (employeeDoc.empty) {
                    alert("Employee not found for archiving.");
                    return;
                }

                const employeeData = employeeDoc.docs[0].data();
                
                // Add to archivedEmployees collection
                await setDoc(doc(db, `artifacts/${currentAppId}/public/data/archivedEmployees`, employeeId), {
                    ...employeeData,
                    archiveDate: new Date().toISOString()
                });

                // Delete from active employees collection
                await deleteDoc(employeeRef);
                alert('Employee archived successfully!');
                if (currentEmployeeId === employeeId) {
                    setCurrentEmployeeId(null);
                    setCurrentPage('admin');
                }
            } catch (e) {
                console.error("Error archiving document: ", e);
                alert("Error archiving employee.");
            }
        }
    }, [db, userId, currentEmployeeId, currentAppId]);

    const restoreEmployee = useCallback(async (employeeId) => {
        if (!db || !userId) {
            alert("Database not ready or user not authenticated.");
            return;
        }
        if (window.confirm(`Are you sure you want to restore this employee?`)) {
            try {
                const archivedEmployeeRef = doc(db, `artifacts/${currentAppId}/public/data/archivedEmployees`, employeeId);
                const archivedEmployeeDoc = await getDocs(query(collection(db, `artifacts/${currentAppId}/public/data/archivedEmployees`), where("__name__", "==", employeeId)));

                if (archivedEmployeeDoc.empty) {
                    alert("Archived employee not found for restoring.");
                    return;
                }

                const employeeData = archivedEmployeeDoc.docs[0].data();
                // Remove archiveDate before restoring
                delete employeeData.archiveDate;

                // Check if an active employee with the same username already exists
                const q = query(collection(db, `artifacts/${currentAppId}/public/data/employees`), where("username", "==", employeeData.username));
                const existingEmployeeSnapshot = await getDocs(q);
                if (!existingEmployeeSnapshot.empty) {
                    alert(`Cannot restore: An active employee with the username '${employeeData.username}' already exists. Please rename the existing employee or the archived one before restoring.`);
                    return;
                }

                // Add back to active employees collection
                await setDoc(doc(db, `artifacts/${currentAppId}/public/data/employees`, employeeId), employeeData);

                // Delete from archivedEmployees collection
                await deleteDoc(archivedEmployeeRef);
                alert('Employee restored successfully!');
            } catch (e) {
                console.error("Error restoring document: ", e);
                alert("Error restoring employee.");
            }
        }
    }, [db, userId, currentAppId]);

    const deleteEmployeePermanently = useCallback(async (employeeId) => {
        if (!db || !userId) {
            alert("Database not ready or user not authenticated.");
            return;
        }
        if (window.confirm(`Are you sure you want to PERMANENTLY DELETE this employee? This action cannot be undone.`)) {
            try {
                const archivedEmployeeRef = doc(db, `artifacts/${currentAppId}/public/data/archivedEmployees`, employeeId);
                await deleteDoc(archivedEmployeeRef);
                alert('Employee permanently deleted!');
            } catch (e) {
                console.error("Error permanently deleting document: ", e);
                alert("Error permanently deleting employee.");
            }
        }
    }, [db, userId, currentAppId]);


    const contextValue = {
        currentUserRole,
        employees,
        archivedEmployees, // Expose archived employees
        currentEmployeeId,
        currentPage,
        setCurrentPage,
        setCurrentEmployeeId,
        handleLogin,
        handleLogout,
        addEmployee,
        updateEmployee,
        updateEmployeeCredentials, // New function for credentials
        archiveEmployee, // New function for archiving
        restoreEmployee, // New function for restoring
        deleteEmployeePermanently, // New function for permanent deletion
        isAuthReady // Expose auth readiness
    };

    // Only render children when Firebase is initialized and auth state is ready
    if (!isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-xl text-gray-700">Loading application...</p>
            </div>
        );
    }

    return (
        <SkillTrackerContext.Provider value={contextValue}>
            {children}
        </SkillTrackerContext.Provider>
    );
};

// --- 3. COMPONENTS ---

// LoginPage Component
const LoginPage = () => {
    const { handleLogin } = useSkillTracker();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState(''); // To hold the role selected by the user

    const handleLoginClick = (role) => {
        setSelectedRole(role);
    };

    const handleAuthenticate = (e) => {
        e.preventDefault();
        if (username && password && selectedRole) {
            handleLogin(selectedRole, username, password);
        } else {
            alert('Please enter username, password, and select a role.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-lg shadow-xl">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Welcome to Skill Tracker
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Select your role to proceed
                    </p>
                </div>
                {!selectedRole ? (
                    <div className="flex flex-col space-y-4">
                        <button
                            onClick={() => handleLoginClick('admin')}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Login as Admin
                        </button>
                        <button
                            onClick={() => handleLoginClick('employee')}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-600 border-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Login as Employee
                        </button>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleAuthenticate}>
                        <h3 className="text-center text-xl font-semibold text-gray-800">Login as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</h3>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="username" className="sr-only">Username</label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text" // Always text for username
                                    autoComplete="username"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Username" // Changed placeholder
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Sign in
                            </button>
                        </div>
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setSelectedRole('')}
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Back to role selection
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

// Navbar Component
const Navbar = () => {
    const { currentUserRole, setCurrentPage, handleLogout } = useSkillTracker();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="bg-indigo-600 p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-white text-2xl font-bold">Skill Tracker</div>
                {/* Hamburger menu for mobile */}
                <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
                {/* Desktop menu */}
                <ul className="hidden md:flex space-x-6">
                    {currentUserRole === 'admin' && (
                        <>
                            <li>
                                <a href="#" onClick={() => setCurrentPage('admin')} className="text-white hover:text-indigo-200">Admin Dashboard</a>
                            </li>
                            <li>
                                <a href="#" onClick={() => setCurrentPage('manage-users')} className="text-white hover:text-indigo-200">Manage Users</a>
                            </li>
                        </>
                    )}
                    {(currentUserRole === 'admin' || currentUserRole === 'employee') && (
                        <li>
                            <a href="#" onClick={() => setCurrentPage('my-progress')} className="text-white hover:text-indigo-200">My Progress</a>
                        </li>
                    )}
                    <li>
                        <a href="#" onClick={() => setCurrentPage('company-overview')} className="text-white hover:text-indigo-200">Company Overview</a>
                    </li>
                    <li>
                        <a href="#" onClick={handleLogout} className="text-white hover:text-indigo-200">Logout</a>
                    </li>
                </ul>
            </div>
            {/* Mobile menu dropdown */}
            {isMenuOpen && (
                <div className="md:hidden bg-indigo-700 mt-2 rounded-md shadow-lg">
                    <ul className="flex flex-col space-y-2 p-4">
                        {currentUserRole === 'admin' && (
                            <>
                                <li>
                                    <a href="#" onClick={() => { setCurrentPage('admin'); setIsMenuOpen(false); }} className="block text-white hover:text-indigo-200">Admin Dashboard</a>
                                </li>
                                <li>
                                    <a href="#" onClick={() => { setCurrentPage('manage-users'); setIsMenuOpen(false); }} className="block text-white hover:text-indigo-200">Manage Users</a>
                                </li>
                            </>
                        )}
                        {(currentUserRole === 'admin' || currentUserRole === 'employee') && (
                            <li>
                                <a href="#" onClick={() => { setCurrentPage('my-progress'); setIsMenuOpen(false); }} className="block text-white hover:text-indigo-200">My Progress</a>
                            </li>
                        )}
                        <li>
                            <a href="#" onClick={() => { setCurrentPage('company-overview'); setIsMenuOpen(false); }} className="block text-white hover:text-indigo-200">Company Overview</a>
                        </li>
                        <li>
                            <a href="#" onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="block text-white hover:text-indigo-200">Logout</a>
                        </li>
                    </ul>
                </div>
            )}
        </nav>
    );
};

// AdminDashboard Component (Simplified, Add Employee moved to ManageUsersPage)
const AdminDashboard = () => {
    const { employees, setCurrentPage, setCurrentEmployeeId } = useSkillTracker(); // Added setCurrentEmployeeId

    // Function to check if an employee is eligible for promotion
    const isEligibleForPromotion = (employee) => {
        if (!employee || !employee.calculatedData || !employee.calculatedData.levelData) {
            return false;
        }
        const currentLevelIndex = MATRICES.SCORE_LEVEL_MAP.findIndex(map => map.level === employee.currentLevel);
        const calculatedLevelIndex = MATRICES.SCORE_LEVEL_MAP.findIndex(map => map.level === employee.calculatedData.levelData.level);
        
        // If calculated level is higher than their current confirmed level
        return calculatedLevelIndex < currentLevelIndex; // Lower index means higher level in our map
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Employee Overview</h2>
                <button
                    onClick={() => setCurrentPage('manage-users')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 mb-4"
                >
                    Manage Users (Add/Edit/Delete)
                </button>
                <div className="space-y-4 mt-4">
                    {employees.length === 0 ? (
                        <p className="text-gray-500">No employees added yet. Go to Manage Users to add one.</p>
                    ) : (
                        employees.map(employee => (
                            <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {employee.fullName} {/* Display full name */}
                                        {isEligibleForPromotion(employee) && (
                                            <span className="ml-2 text-yellow-500 text-xl font-bold" title="Eligible for Promotion!">
                                                &#9888;
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-600">{employee.role} | Current Level: <span className="font-bold">{employee.currentLevel}</span></p>
                                    {/* Added conditional rendering for calculatedData */}
                                    <p className="text-sm text-gray-600">
                                        Calculated Score: <span className="font-bold">{employee.calculatedData?.totalScore ?? 'N/A'}</span> |
                                        Calculated Level: <span className="font-bold">{employee.calculatedData?.levelData?.level ?? 'N/A'}</span>
                                    </p>
                                </div>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => {
                                            setCurrentEmployeeId(employee.id);
                                            setCurrentPage('employee-detail');
                                        }}
                                        className="view-employee-btn bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-600"
                                    >
                                        View/Edit Skills
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// SkillEditModal Component (New Component for popup)
const SkillEditModal = ({ isOpen, onClose, skillCategory, onSaveSkills, isAdminContext }) => {
    const [localSkills, setLocalSkills] = useState([]);

    useEffect(() => {
        if (skillCategory) {
            setLocalSkills(skillCategory.skills.map(s => ({ ...s }))); // Deep copy for local editing
        }
    }, [skillCategory]);

    if (!isOpen || !skillCategory) return null;

    const handleScoreChange = (skillName, value) => {
        setLocalSkills(prevSkills =>
            prevSkills.map(skill =>
                skill.name === skillName ? { ...skill, score: Math.max(0, Math.min(value, skill.maxScore)) } : skill
            )
        );
    };

    const handleLast6MonthsScoreChange = (skillName, value) => {
        setLocalSkills(prevSkills =>
            prevSkills.map(skill =>
                skill.name === skillName ? { ...skill, last6MonthsScore: Math.max(0, Math.min(value, skill.maxScore)) } : skill
            )
        );
    };

    const handleSave = () => {
        onSaveSkills(skillCategory.category, localSkills);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    {isAdminContext ? 'Edit' : 'View'} {skillCategory.category} Skills
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {localSkills.map(skill => (
                        <div key={skill.name} className="flex flex-col">
                            <label htmlFor={`modal-skill-${skill.name}`} className="block text-sm font-medium text-gray-700">
                                {skill.name} (Max: {skill.maxScore})
                            </label>
                            <input
                                type="number"
                                id={`modal-skill-${skill.name}`}
                                min="0"
                                max={skill.maxScore}
                                value={skill.score}
                                onChange={(e) => handleScoreChange(e.target.value)}
                                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${isAdminContext ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                readOnly={!isAdminContext}
                            />
                            <label htmlFor={`modal-last6months-${skill.name}`} className="block text-xs font-medium text-gray-500 mt-1">
                                Last 6 Months Score
                            </label>
                            <input
                                type="number"
                                id={`modal-last6months-${skill.name}`}
                                min="0"
                                max={skill.maxScore}
                                value={skill.last6MonthsScore}
                                onChange={(e) => handleLast6MonthsScoreChange(e.target.value)}
                                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xs ${isAdminContext ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                readOnly={!isAdminContext}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-4">
                    {isAdminContext && (
                        <button
                            onClick={handleSave}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                            Save Changes
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                        {isAdminContext ? 'Cancel' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// TaskDetailModal Component (New Component for viewing individual task details)
const TaskDetailModal = ({ isOpen, onClose, task, isAdminContext, onApproveTask, categoryName }) => {
    if (!isOpen || !task) return null;

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-500 text-white';
            case 'Medium': return 'bg-yellow-500 text-gray-800';
            case 'Low': return 'bg-green-500 text-white';
            default: return 'bg-gray-400 text-white';
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Task Details: {task.name}</h2>
                <div className="space-y-3 mb-6">
                    <p><span className="font-medium">Points:</span> {task.points}</p>
                    <p><span className="font-medium">Description:</span> {task.description || 'N/A'}</p>
                    <p>
                        <span className="font-medium">Priority:</span> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                            {task.priority || 'N/A'}
                        </span>
                    </p>
                    <p><span className="font-medium">Status:</span> <span className={`font-semibold ${task.status === 'approved' ? 'text-green-700' : 'text-blue-700'}`}>{task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span></p>
                </div>
                <div className="flex justify-end space-x-4">
                    {isAdminContext && task.status !== 'approved' && (
                        <button
                            onClick={() => { onApproveTask(categoryName, task.id); onClose(); }}
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                        >
                            Approve Points
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


// EmployeeDetail Component
const EmployeeDetail = ({ employee, isAdminContext }) => {
    const { updateEmployee, setCurrentPage } = useSkillTracker();
    const [localEmployee, setLocalEmployee] = useState(employee);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [selectedSkillCategory, setSelectedSkillCategory] = useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false); // State for the Task Management/Assignment Modal
    const [selectedTaskCategory, setSelectedTaskCategory] = useState(null); // Category for the Task Management Modal
    const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false); // State for individual Task Detail Modal
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null); // Specific task for detail modal
    const [selectedTaskCategoryForDetail, setSelectedTaskCategoryForDetail] = useState(null); // Category for task detail modal

    // Update local state if employee prop changes (e.g., admin selects different employee)
    useEffect(() => {
        setLocalEmployee(employee);
    }, [employee]);

    // Recalculate and update global state when local employee data changes
    useEffect(() => {
        if (localEmployee) {
            updateEmployee(localEmployee);
        }
    }, [localEmployee, updateEmployee]);

    const handleRoleChange = (e) => {
        const newRole = e.target.value;
        setLocalEmployee(prevEmployee => ({
            ...prevEmployee,
            role: newRole
        }));
    };

    const handleLevelChange = (e) => {
        const newLevel = e.target.value;
        const currentLevelIndex = MATRICES.SCORE_LEVEL_MAP.findIndex(map => map.level === localEmployee.currentLevel);
        const newLevelIndex = MATRICES.SCORE_LEVEL_MAP.findIndex(map => map.level === newLevel);

        // Only confirm promotion if the new level is actually higher (lower index)
        if (newLevelIndex < currentLevelIndex) {
             if (window.confirm(`Are you sure you want to promote ${localEmployee.fullName} to ${newLevel}? This will reset their 'Time at Role' and add it to 'Total Years in Company'.`)) {
                setLocalEmployee(prevEmployee => ({
                    ...prevEmployee,
                    currentLevel: newLevel,
                    totalYearsInCompany: parseFloat((prevEmployee.totalYearsInCompany + prevEmployee.timeAtRole).toFixed(1)),
                    timeAtRole: 0
                }));
                alert(`${localEmployee.fullName} promoted to ${newLevel}!`);
            } else {
                // If cancelled, revert the dropdown selection
                e.target.value = localEmployee.currentLevel;
            }
        } else { // Demoting or setting to same/lower level
            setLocalEmployee(prevEmployee => ({
                ...prevEmployee,
                currentLevel: newLevel
            }));
        }
    };

    const handleTimeAtRoleChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        setLocalEmployee(prevEmployee => ({
            ...prevEmployee,
            timeAtRole: Math.max(0, value)
        }));
    };

    // This function is now passed to TaskModal
    const handleAddTask = (categoryName, taskName, taskDescription, taskPoints, taskPriority) => {
        setLocalEmployee(prevEmployee => {
            const newSkills = prevEmployee.skills.map(cat => {
                if (cat.category === categoryName) {
                    const newTasks = cat.tasks ? [...cat.tasks] : [];
                    newTasks.push({
                        id: Date.now().toString(),
                        name: taskName,
                        description: taskDescription,
                        points: taskPoints,
                        status: 'pending',
                        priority: taskPriority
                    });
                    return { ...cat, tasks: newTasks };
                }
                return cat;
            });
            return { ...prevEmployee, skills: newSkills };
        });
    };

    // This function is now passed to TaskModal and TaskDetailModal
    const handleApproveTask = (categoryName, taskId) => {
        setLocalEmployee(prevEmployee => {
            const newSkills = prevEmployee.skills.map(cat => {
                if (cat.category === categoryName) {
                    const newTasks = cat.tasks.map(task => {
                        if (task.id === taskId && task.status !== 'approved') {
                            const targetSkill = cat.skills[0]; // Add to first skill in category
                            if (targetSkill) {
                                targetSkill.score = Math.min(targetSkill.maxScore, targetSkill.score + task.points);
                            }
                            return { ...task, status: 'approved' };
                        }
                        return task;
                    });
                    return { ...cat, skills: cat.skills, tasks: newTasks };
                }
                return cat;
            });
            return { ...prevEmployee, skills: newSkills };
        });
    };

    const handleOpenSkillModal = (skillCategory) => {
        setSelectedSkillCategory(skillCategory);
        setIsSkillModalOpen(true);
    };

    const handleCloseSkillModal = () => {
        setIsSkillModalOpen(false);
        setSelectedSkillCategory(null);
    };

    const handleSaveSkillsInModal = (categoryName, updatedSkills) => {
        setLocalEmployee(prevEmployee => {
            const newSkills = prevEmployee.skills.map(cat => {
                if (cat.category === categoryName) {
                    return { ...cat, skills: updatedSkills };
                }
                return cat;
            });
            return { ...prevEmployee, skills: newSkills };
        });
    };

    // Handlers for Task Management Modal
    const handleOpenTaskModal = (skillCategory) => {
        setSelectedTaskCategory(skillCategory);
        setIsTaskModalOpen(true);
    };

    const handleCloseTaskModal = () => {
        setIsTaskModalOpen(false);
        setSelectedTaskCategory(null);
    };

    // Handlers for Task Detail Modal
    const handleOpenTaskDetailModal = (category, task) => {
        setSelectedTaskCategoryForDetail(category);
        setSelectedTaskForDetail(task);
        setIsTaskDetailModalOpen(true);
    };

    const handleCloseTaskDetailModal = () => {
        setIsTaskDetailModalOpen(false);
        setSelectedTaskForDetail(null);
        setSelectedTaskCategoryForDetail(null);
    };


    // Function to check if an employee is eligible for promotion (based on calculated vs current level)
    const isEligibleForPromotion = (employee) => {
        if (!employee || !employee.calculatedData || !employee.calculatedData.levelData) {
            return false;
        }
        const currentLevelIndex = MATRICES.SCORE_LEVEL_MAP.findIndex(map => map.level === employee.currentLevel);
        const calculatedLevelIndex = MATRICES.SCORE_LEVEL_MAP.findIndex(map => map.level === employee.calculatedData.levelData.level);
        
        return calculatedLevelIndex < currentLevelIndex;
    };

    // Chart logic
    const skillGrowthChartRef = useRef(null);
    const skillGrowthChartInstance = useRef(null);

    useEffect(() => {
        if (!localEmployee || !skillGrowthChartRef.current) return;

        const ctx = skillGrowthChartRef.current.getContext('2d');
        const labels = [];
        const currentScores = [];
        const last6MonthsScores = [];
        const maxScores = [];

        localEmployee.skills.forEach(category => {
            category.skills.forEach(skill => {
                labels.push(skill.name);
                currentScores.push(skill.score);
                last6MonthsScores.push(skill.last6MonthsScore); // Corrected property name
                maxScores.push(skill.maxScore);
            });
        });

        if (skillGrowthChartInstance.current) {
            skillGrowthChartInstance.current.data.labels = labels;
            skillGrowthChartInstance.current.data.datasets[0].data = currentScores;
            skillGrowthChartInstance.current.data.datasets[1].data = last6MonthsScores;
            skillGrowthChartInstance.current.data.datasets[2].data = maxScores;
            skillGrowthChartInstance.current.update();
        } else {
            skillGrowthChartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Current Score',
                            data: currentScores,
                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Last 6 Months Score',
                            data: last6MonthsScores,
                            backgroundColor: 'rgba(153, 102, 255, 0.6)',
                            borderColor: 'rgba(153, 102, 255, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Max Score',
                            data: maxScores,
                            backgroundColor: 'rgba(201, 203, 207, 0.6)',
                            borderColor: 'rgba(201, 203, 207, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 20
                        }
                    },
                    plugins: {
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    }
                }
            });
        }
        return () => {
            if (skillGrowthChartInstance.current) {
                skillGrowthChartInstance.current.destroy();
                skillGrowthChartInstance.current = null;
            }
        };
    }, [localEmployee]);


    if (!localEmployee) {
        return <p className="text-center text-gray-600">Loading employee data...</p>;
    }

    return (
        <div className="container mx-auto p-6">
            {isAdminContext && (
                <button
                    onClick={() => setCurrentPage('admin')}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 mb-6"
                >
                    ← Back to Admin Dashboard
                </button>
            )}
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {localEmployee.fullName}'s Skills Assessment
            </h1>
            
            <div className="flex flex-col md:flex-row md:items-center text-lg text-gray-600 mb-6 space-y-2 md:space-y-0 md:space-x-4">
                <div className="flex items-center">
                    <label htmlFor="employee-role-select" className="mr-2">Role:</label>
                    {isAdminContext ? (
                        <select
                            id="employee-role-select"
                            value={localEmployee.role}
                            onChange={handleRoleChange}
                            className="border border-gray-300 rounded-md shadow-sm p-1"
                        >
                            {Object.keys(MATRICES.ROLE_WEIGHTS).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    ) : (
                        <span className="font-bold">{localEmployee.role}</span>
                    )}
                </div>

                <div className="flex items-center">
                    <label htmlFor="employee-level-select" className="mr-2">Current Level:</label>
                    {isAdminContext ? (
                        <select
                            id="employee-level-select"
                            value={localEmployee.currentLevel}
                            onChange={handleLevelChange}
                            className="border border-gray-300 rounded-md shadow-sm p-1"
                        >
                            {MATRICES.SCORE_LEVEL_MAP.map(item => (
                                <option key={item.level} value={item.level}>{item.level}</option>
                            ))}
                        </select>
                    ) : (
                        <span className="font-bold">{localEmployee.currentLevel}</span>
                    )}
                    {isAdminContext && isEligibleForPromotion(localEmployee) && (
                        <span className="ml-2 text-yellow-500 text-xl font-bold" title="Eligible for Promotion!">
                            &#9888;
                        </span>
                    )}
                </div>

                <div className="flex items-center">
                    <label htmlFor="time-at-role-input" className="mr-2">Time at Role:</label>
                    <input
                        type="number"
                        id="time-at-role-input"
                        value={localEmployee.timeAtRole.toFixed(1)}
                        onChange={handleTimeAtRoleChange}
                        className={`border border-gray-300 rounded-md shadow-sm p-1 w-24 ${isAdminContext ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                        step="0.1"
                        readOnly={!isAdminContext}
                    />
                    <span className="ml-1">years</span>
                </div>
                <span className="md:ml-4">Total Years in Company: <span className="font-bold">{localEmployee.totalYearsInCompany.toFixed(1)}</span> years</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md col-span-1">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Summary</h2>
                    <p className="mb-2">Calculated Total Score: <span className="font-bold">{localEmployee.calculatedData.totalScore}</span></p>
                    <p className="mb-2">Calculated Level: <span className="font-bold">{localEmployee.calculatedData.levelData.level}</span></p>
                    <p className="mb-2">Required PM Skill: <span className="font-bold">{localEmployee.calculatedData.levelData.pmSkill}</span></p>
                    <p className="mb-2">Best Fit Role (Analysis): <span className="font-bold text-indigo-600">{localEmployee.calculatedData.bestFitRole}</span></p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md col-span-2">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Skill Growth (Current vs Last 6 Months)</h2>
                    <div className="h-72">
                        <canvas ref={skillGrowthChartRef}></canvas>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {localEmployee.skills.map(skillCategory => (
                    <div key={skillCategory.category} className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">{skillCategory.category}</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleOpenSkillModal(skillCategory)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-sm"
                                >
                                    {isAdminContext ? 'Edit Skills' : 'Show Details'}
                                </button>
                                <button
                                    onClick={() => handleOpenTaskModal(skillCategory)} // Button to open task management modal
                                    className="bg-purple-500 text-white px-3 py-1 rounded-md hover:bg-purple-600 text-sm"
                                >
                                    {isAdminContext ? 'Manage Tasks' : 'View Tasks'}
                                </button>
                            </div>
                        </div>
                        <p className="text-lg font-bold text-gray-800 mt-4">
                            Sub Total: <span className="font-bold">{localEmployee.calculatedData.subTotals[skillCategory.category]}</span>
                        </p>

                        {/* Display assigned tasks with title, points, priority, and view details button */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-md">
                            <h4 className="text-md font-semibold text-gray-700 mb-2">Assigned Tasks:</h4>
                            <div className="tasks-list space-y-2">
                                {skillCategory.tasks && skillCategory.tasks.length > 0 ? (
                                    skillCategory.tasks.map(task => (
                                        <div key={task.id} className="flex justify-between items-center p-2 border border-gray-200 rounded-md bg-white">
                                            <div>
                                                <p className="font-medium text-gray-800">{task.name} ({task.points} pts)</p>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    task.priority === 'High' ? 'bg-red-200 text-red-800' :
                                                    task.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                                                    'bg-green-200 text-green-800'
                                                }`}>
                                                    {task.priority || 'N/A'}
                                                </span>
                                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${task.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleOpenTaskDetailModal(skillCategory.category, task)}
                                                className="bg-gray-400 text-white px-3 py-1 rounded-md hover:bg-gray-500 text-xs"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm">No tasks assigned yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <SkillEditModal
                isOpen={isSkillModalOpen}
                onClose={handleCloseSkillModal}
                skillCategory={selectedSkillCategory}
                onSaveSkills={handleSaveSkillsInModal}
                isAdminContext={isAdminContext}
            />

            {/* Task Management/Assignment Modal */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={handleCloseTaskModal}
                skillCategory={selectedTaskCategory}
                onAddTask={handleAddTask}
                onApproveTask={handleApproveTask}
                isAdminContext={isAdminContext}
            />

            {/* Individual Task Detail Modal */}
            <TaskDetailModal
                isOpen={isTaskDetailModalOpen}
                onClose={handleCloseTaskDetailModal}
                task={selectedTaskForDetail}
                isAdminContext={isAdminContext}
                onApproveTask={handleApproveTask}
                categoryName={selectedTaskCategoryForDetail}
            />
        </div>
    );
};

// TaskAssignmentForm Component (Now includes priority)
const TaskAssignmentForm = ({ category, onAddTask }) => {
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskPoints, setTaskPoints] = useState(1);
    const [taskPriority, setTaskPriority] = useState('Medium'); // Default priority

    const handleSubmit = (e) => {
        e.preventDefault();
        if (taskName && !isNaN(taskPoints) && taskPoints > 0) {
            onAddTask(category, taskName, taskDescription, taskPoints, taskPriority);
            setTaskName('');
            setTaskDescription('');
            setTaskPoints(1);
            setTaskPriority('Medium');
        } else {
            alert("Please enter a valid Task Name and positive Points.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2 mb-4">
            <div>
                <label htmlFor={`task-name-${category}`} className="block text-sm font-medium text-gray-700">Task Name</label>
                <input
                    type="text"
                    id={`task-name-${category}`}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor={`task-description-${category}`} className="block text-sm font-medium text-gray-700">Task Description</label>
                <textarea
                    id={`task-description-${category}`}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows="2"
                ></textarea>
            </div>
            <div>
                <label htmlFor={`task-points-${category}`} className="block text-sm font-medium text-gray-700">Points to Award</label>
                <input
                    type="number"
                    id={`task-points-${category}`}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    min="1"
                    value={taskPoints}
                    onChange={(e) => setTaskPoints(parseInt(e.target.value))}
                    required
                />
            </div>
            <div>
                <label htmlFor={`task-priority-${category}`} className="block text-sm font-medium text-gray-700">Priority Level</label>
                <select
                    id={`task-priority-${category}`}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    required
                >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </select>
            </div>
            <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">Assign Task</button>
        </form>
    );
};

// TaskItem Component (Used only within TaskModal now)
const TaskItem = ({ task, category, isAdminContext, onApproveTask }) => {
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-800';
            case 'Medium': return 'bg-yellow-100 text-yellow-800';
            case 'Low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className={`p-3 rounded-md border text-sm ${task.status === 'approved' ? 'bg-green-100 border-green-300' : 'bg-blue-50 border-blue-200'}`}>
            <p className="font-medium">{task.name} ({task.points} pts)</p>
            {task.description && <p className="text-gray-700 text-xs">{task.description}</p>}
            <p className="text-gray-600 text-xs mt-1">
                Status: <span className={`font-semibold ${task.status === 'approved' ? 'text-green-700' : 'text-blue-700'}`}>{task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                    {task.priority || 'N/A'}
                </span>
            </p>
            {isAdminContext && task.status !== 'approved' && (
                <button
                    onClick={() => onApproveTask(category, task.id)}
                    className="approve-task-btn bg-purple-500 text-white px-2 py-1 text-xs rounded-md mt-2 hover:bg-purple-600"
                >
                    Approve Points
                </button>
            )}
        </div>
    );
};

// TaskModal Component (For managing/assigning tasks)
const TaskModal = ({ isOpen, onClose, skillCategory, onAddTask, onApproveTask, isAdminContext }) => {
    if (!isOpen || !skillCategory) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    {isAdminContext ? 'Manage' : 'View'} Tasks for {skillCategory.category}
                </h2>
                
                {isAdminContext && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Assign New Task</h3>
                        <TaskAssignmentForm category={skillCategory.category} onAddTask={onAddTask} />
                    </div>
                )}

                <h3 className="text-lg font-semibold text-gray-700 mb-2">Assigned Tasks:</h3>
                <div className="tasks-list space-y-2 mb-6">
                    {skillCategory.tasks && skillCategory.tasks.length > 0 ? (
                        skillCategory.tasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                category={skillCategory.category}
                                isAdminContext={isAdminContext}
                                onApproveTask={onApproveTask}
                            />
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">No tasks assigned yet.</p>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// EditUserModal Component (New for editing employee credentials)
const EditUserModal = ({ isOpen, onClose, employee, onSaveCredentials }) => {
    const [localFullName, setLocalFullName] = useState(''); // New state for full name
    const [localUsername, setLocalUsername] = useState(''); // New state for username
    const [localPassword, setLocalPassword] = useState('');

    useEffect(() => {
        if (employee) {
            setLocalFullName(employee.fullName); // Set full name
            setLocalUsername(employee.username); // Set username
            setLocalPassword(''); // Clear password field for security
        }
    }, [employee]);

    if (!isOpen || !employee) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (localFullName && localUsername) { // Validate both fields
            onSaveCredentials(employee.id, localFullName, localUsername, localPassword);
            onClose();
        } else {
            alert('Full Name and Username cannot be empty.');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Edit Employee Credentials</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="edit-full-name" className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            id="edit-full-name"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={localFullName}
                            onChange={(e) => setLocalFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            id="edit-username"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={localUsername}
                            onChange={(e) => setLocalUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current)</label>
                        <input
                            type="password"
                            id="edit-password"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={localPassword}
                            onChange={(e) => setLocalPassword(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            <span className="font-bold text-red-600">SECURITY WARNING:</span> Passwords are hashed client-side for this demo. For production, this must be done on a secure backend.
                        </p>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ManageUsersPage Component (New Page for Admin User Management)
const ManageUsersPage = () => {
    const { employees, archivedEmployees, addEmployee, archiveEmployee, restoreEmployee, updateEmployeeCredentials, deleteEmployeePermanently, setCurrentPage, setCurrentEmployeeId } = useSkillTracker(); // Added deleteEmployeePermanently
    const [employeeFullName, setEmployeeFullName] = useState(''); // New state for full name
    const [employeeUsername, setEmployeeUsername] = useState(''); // New state for username
    const [employeeRole, setEmployeeRole] = useState('');
    const [employeeTimeAtRole, setEmployeeTimeAtRole] = useState('');
    const [employeePassword, setEmployeePassword] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState(null);

    const handleAddEmployeeSubmit = async (e) => {
        e.preventDefault();
        if (employeeFullName && employeeUsername && employeeRole && !isNaN(parseFloat(employeeTimeAtRole)) && parseFloat(employeeTimeAtRole) >= 0 && employeePassword) {
            await addEmployee(employeeFullName, employeeUsername, employeeRole, parseFloat(employeeTimeAtRole), employeePassword);
            setEmployeeFullName('');
            setEmployeeUsername('');
            setEmployeeRole('');
            setEmployeeTimeAtRole('');
            setEmployeePassword('');
        } else {
            alert('Please fill in all employee details (Full Name, Username, Role, Years in Current Role, Password) correctly.');
        }
    };

    const handleOpenEditModal = (employee) => {
        setSelectedEmployeeForEdit(employee);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedEmployeeForEdit(null);
    };

    return (
        <div className="container mx-auto p-6">
            <button
                onClick={() => setCurrentPage('admin')}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 mb-6"
            >
                ← Back to Admin Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Users</h1>

            {/* Add New Employee Section */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Add New Employee</h2>
                <form onSubmit={handleAddEmployeeSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="new-employee-full-name" className="block text-sm font-medium text-gray-700">Full Name</label> {/* Updated label */}
                        <input
                            type="text"
                            id="new-employee-full-name"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={employeeFullName}
                            onChange={(e) => setEmployeeFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="new-employee-username" className="block text-sm font-medium text-gray-700">Username</label> {/* New username field */}
                        <input
                            type="text"
                            id="new-employee-username"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={employeeUsername}
                            onChange={(e) => setEmployeeUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="new-employee-role" className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            id="new-employee-role"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={employeeRole}
                            onChange={(e) => setEmployeeRole(e.target.value)}
                            required
                        >
                            <option value="">Select a Role</option>
                            <option value="Assistant Engineer">Assistant Engineer</option>
                            {Object.keys(MATRICES.ROLE_WEIGHTS).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="new-employee-time-at-role" className="block text-sm font-medium text-gray-700">Years in Current Role</label> {/* Updated label */}
                        <input
                            type="number"
                            id="new-employee-time-at-role"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            step="0.1"
                            value={employeeTimeAtRole}
                            onChange={(e) => setEmployeeTimeAtRole(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="new-employee-password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            id="new-employee-password"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={employeePassword}
                            onChange={(e) => setEmployeePassword(e.target.value)}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            <span className="font-bold text-red-600">SECURITY WARNING:</span> Passwords are hashed client-side for this demo. For production, this must be done on a secure backend.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Add Employee</button>
                    </div>
                </form>
            </div>

            {/* Active Employees List */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Active Employees</h2>
                <div className="space-y-4">
                    {employees.length === 0 ? (
                        <p className="text-gray-500">No active employees.</p>
                    ) : (
                        employees.map(employee => (
                            <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{employee.fullName}</h3> {/* Display full name */}
                                    <p className="text-sm text-gray-600">Username: {employee.username}</p> {/* Display username */}
                                    <p className="text-sm text-gray-600">{employee.role} | Level: {employee.currentLevel}</p>
                                </div>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => handleOpenEditModal(employee)}
                                        className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                                    >
                                        Edit Credentials
                                    </button>
                                    <button
                                        onClick={() => archiveEmployee(employee.id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                                    >
                                        Archive
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Archived Employees Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-gray-700">Archived Employees</h2>
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                    >
                        {showArchived ? 'Hide Archived' : 'Show Archived'} ({archivedEmployees.length})
                    </button>
                </div>
                {showArchived && (
                    <div className="space-y-4 mt-4">
                        {archivedEmployees.length === 0 ? (
                            <p className="text-gray-500">No archived employees.</p>
                        ) : (
                            archivedEmployees.map(employee => (
                                <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-sm">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700">{employee.fullName} (Archived)</h3> {/* Display full name */}
                                        <p className="text-sm text-gray-500">Username: {employee.username}</p> {/* Display username */}
                                        <p className="text-sm text-gray-500">Archived on: {new Date(employee.archiveDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="space-x-2">
                                        <button
                                            onClick={() => restoreEmployee(employee.id)}
                                            className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                                        >
                                            Restore
                                        </button>
                                        <button
                                            onClick={() => deleteEmployeePermanently(employee.id)}
                                            className="bg-red-700 text-white px-3 py-1 rounded-md hover:bg-red-800"
                                        >
                                            Permanently Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                employee={selectedEmployeeForEdit}
                onSaveCredentials={updateEmployeeCredentials}
            />
        </div>
    );
};


// CompanyOverview Component
const CompanyOverview = () => {
    const { employees } = useSkillTracker();
    const companySkillDistributionChartRef = useRef(null);
    const companySkillDistributionChartInstance = useRef(null);

    useEffect(() => {
        if (!employees.length) {
            companySkillDistributionChartInstance.current?.destroy();
            companySkillDistributionChartInstance.current = null;
            return;
        }

        const ctx = companySkillDistributionChartRef.current.getContext('2d');
        const { aggregatedRawScores, aggregatedMaxPossibleScores } = getCompanySkillDistribution(employees); // Get both raw sums and max possible sums

        const labels = [];
        const data = [];
        const backgroundColors = [];
        const borderColors = [];

        const categoryColors = {
            M: { bg: 'rgba(255, 99, 132, 0.6)', border: 'rgba(255, 99, 132, 1)' }, // Red
            E: { bg: 'rgba(54, 162, 235, 0.6)', border: 'rgba(54, 162, 235, 1)' },  // Blue
            S: { bg: 'rgba(255, 206, 86, 0.6)', border: 'rgba(255, 206, 86, 1)' },  // Yellow
            B: { bg: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)' },  // Green
            PM: { bg: 'rgba(153, 102, 255, 0.6)', border: 'rgba(153, 102, 255, 1)' } // Purple
        };

        // Calculate total company raw score across all categories
        let totalCompanyRawScore = 0;
        for (const key in aggregatedRawScores) {
            if (aggregatedRawScores.hasOwnProperty(key)) {
                totalCompanyRawScore += aggregatedRawScores[key];
            }
        }

        for (const key in aggregatedRawScores) {
            if (aggregatedRawScores.hasOwnProperty(key)) {
                const categoryLabel = {
                    M: 'Mechanical', E: 'Electronics', S: 'Software', B: 'Business', PM: 'Project Management'
                }[key];
                
                // Only add to chart if there's actual score for this category
                // or if it's a category with potential max score (even if current score is 0)
                if (aggregatedRawScores[key] > 0 || aggregatedMaxPossibleScores[key] > 0) {
                    labels.push(categoryLabel);
                    // Percentage is (achieved raw score for category / total achieved raw score across all categories)
                    data.push((aggregatedRawScores[key] / totalCompanyRawScore) * 100);
                    backgroundColors.push(categoryColors[key].bg);
                    borderColors.push(categoryColors[key].border);
                }
            }
        }

        if (companySkillDistributionChartInstance.current) {
            companySkillDistributionChartInstance.current.data.labels = labels;
            companySkillDistributionChartInstance.current.data.datasets[0].data = data;
            companySkillDistributionChartInstance.current.data.datasets[0].backgroundColor = backgroundColors;
            companySkillDistributionChartInstance.current.data.datasets[0].borderColor = borderColors;
            companySkillDistributionChartInstance.current.update();
        } else {
            companySkillDistributionChartInstance.current = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed !== null) {
                                        label += context.parsed.toFixed(1) + '%';
                                    }
                                    return label;
                                }
                            }
                        },
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Overall Company Skill Distribution (by Achieved Points)'
                        }
                    }
                }
            });
        }

        return () => {
            if (companySkillDistributionChartInstance.current) {
                companySkillDistributionChartInstance.current.destroy();
                companySkillDistributionChartInstance.current = null;
            }
        };
    }, [employees]);

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Company Overview</h1>

            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Employee Summary</h2>
                <div className="overflow-x-auto">
                    {employees.length === 0 ? (
                        <p className="py-3 px-4 text-center text-gray-500">No employee data to display.</p>
                    ) : (
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead>
                                <tr className="bg-gray-100 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                                    <th className="py-3 px-4 border-b border-gray-200">Full Name</th> {/* Changed to Full Name */}
                                    <th className="py-3 px-4 border-b border-gray-200">Username</th> {/* New column for Username */}
                                    <th className="py-3 px-4 border-b border-gray-200">Role</th>
                                    <th className="py-3 px-4 border-b border-gray-200">Current Level</th>
                                    <th className="py-3 px-4 border-b border-gray-200">Time at Role</th>
                                    <th className="py-3 px-4 border-b border-gray-200">Total Years</th>
                                    <th className="py-3 px-4 border-b border-gray-200">Total Score</th>
                                    <th className="py-3 px-4 border-b border-gray-200">Calculated Level</th>
                                    <th className="py-3 px-4 border-b border-gray-200">Best Fit Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {employees.map(employee => (
                                    <tr key={employee.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 border-b border-gray-200 text-gray-800">{employee.fullName}</td> {/* Display full name */}
                                        <td className="py-3 px-4 border-b border-gray-200 text-gray-800">{employee.username}</td> {/* Display username */}
                                        <td className="py-3 px-4 border-b border-gray-200 text-gray-800">{employee.role}</td>
                                        <td className="py-3 px-4 border-b border-gray-200 text-gray-800">{employee.timeAtRole.toFixed(1)}</td>
                                        <td className="py-3 px-4 border-b border-gray-200 text-gray-800">{employee.totalYearsInCompany.toFixed(1)}</td>
                                        <td className="py-3 px-4 border-b border-gray-200 text-gray-800">{employee.calculatedData?.totalScore ?? 'N/A'}</td>
                                        <td className="py-3 px-4 border-b border-gray-200 text-gray-800">{employee.calculatedData?.levelData?.level ?? 'N/A'}</td>
                                        <td className="py-3 px-4 border-b border-gray-200 text-gray-800">{employee.calculatedData?.bestFitRole ?? 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Company Skill Distribution</h2>
                <div className="flex justify-center h-96">
                    {employees.length === 0 ? (
                        <p className="text-gray-500 text-center self-center">Add employees to see company skill distribution.</p>
                    ) : (
                        <canvas ref={companySkillDistributionChartRef}></canvas>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- 4. MAIN APP COMPONENT ---

const App = () => {
    return (
        <SkillTrackerProvider>
            <AppContent />
        </SkillTrackerProvider>
    );
};

const AppContent = () => {
    const { currentUserRole, employees, currentEmployeeId, currentPage } = useSkillTracker();

    let employeeToDisplay = null;
    if (currentPage === 'my-progress' && currentUserRole === 'employee') {
        // For employee login, we'll find the employee by their currentEmployeeId
        employeeToDisplay = employees.find(emp => emp.id === currentEmployeeId);
    } else if (currentPage === 'employee-detail' && currentUserRole === 'admin' && currentEmployeeId) {
        employeeToDisplay = employees.find(emp => emp.id === currentEmployeeId);
    }

    if (!currentUserRole) {
        return <LoginPage />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 font-sans antialiased">
            <Navbar />
            <main className="container mx-auto p-6 flex-grow">
                {currentPage === 'admin' && currentUserRole === 'admin' && (
                    <AdminDashboard />
                )}
                {currentPage === 'manage-users' && currentUserRole === 'admin' && (
                    <ManageUsersPage />
                )}
                {(currentPage === 'employee-detail' || currentPage === 'my-progress') && employeeToDisplay && (
                    <EmployeeDetail
                        employee={employeeToDisplay}
                        isAdminContext={currentUserRole === 'admin'}
                    />
                )}
                {currentPage === 'company-overview' && (
                    <CompanyOverview />
                )}
                {/* Fallback for employee view if no employees exist */}
                {currentPage === 'my-progress' && currentUserRole === 'employee' && !employeeToDisplay && (
                    <div className="text-center p-8 bg-white rounded-lg shadow">
                        <p className="text-xl text-gray-700">No employee data found for your view.</p>
                        <p className="text-md text-gray-500 mt-2">Please login as Admin to add employee profiles.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
