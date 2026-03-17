'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
    name: string;
    age: string;
    location: string;
    height: string;
    weight: string;
}

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState<UserProfile>({
        name: '',
        age: '',
        location: '',
        height: '',
        weight: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Save to localStorage for now (can be replaced with API call later)
        localStorage.setItem('smartfuel_user', JSON.stringify(formData));

        // Calculate BMI
        const heightInM = parseFloat(formData.height) / 100;
        const weight = parseFloat(formData.weight);
        const bmi = weight / (heightInM * heightInM);
        localStorage.setItem('smartfuel_bmi', bmi.toFixed(1));

        // Simulate a brief delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));

        // Redirect to main app
        router.push('/');
    };

    const isFormValid = formData.name && formData.age && formData.location &&
        formData.height && formData.weight;

    return (
        <main className="container">
            {/* Header */}
            <header className="header">
                <div className="logo">🍽️</div>
                <h1 className="title">SmartFuel</h1>
                <p className="subtitle">Create Your Profile</p>
            </header>

            {/* Registration Form */}
            <form onSubmit={handleSubmit}>
                <div className="card">
                    <h2 className="card-title">👤 Personal Information</h2>

                    <div className="form-group">
                        <label className="form-label" htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="form-input"
                            placeholder="Enter your name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="age">Age</label>
                        <input
                            type="number"
                            id="age"
                            name="age"
                            className="form-input"
                            placeholder="Enter your age"
                            min="1"
                            max="120"
                            value={formData.age}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="location">Location</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            className="form-input"
                            placeholder="City, Country"
                            value={formData.location}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="card">
                    <h2 className="card-title">📏 Body Metrics</h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="height">Height (cm)</label>
                            <input
                                type="number"
                                id="height"
                                name="height"
                                className="form-input"
                                placeholder="170"
                                min="50"
                                max="300"
                                value={formData.height}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="weight">Weight (kg)</label>
                            <input
                                type="number"
                                id="weight"
                                name="weight"
                                className="form-input"
                                placeholder="70"
                                min="20"
                                max="500"
                                value={formData.weight}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* BMI Preview */}
                    {formData.height && formData.weight && (
                        <div className="bmi-preview">
                            <span className="bmi-label">Estimated BMI:</span>
                            <span className="bmi-value">
                                {(parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)).toFixed(1)}
                            </span>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-analyze"
                    disabled={!isFormValid || isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="loading-spinner" style={{ width: 20, height: 20 }}></span>
                            Creating Profile...
                        </>
                    ) : (
                        <>✨ Create Profile</>
                    )}
                </button>
            </form>

            {/* Skip Link */}
            <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button
                    className="btn-link"
                    onClick={() => router.push('/')}
                >
                    Skip for now →
                </button>
            </div>
        </main>
    );
}
