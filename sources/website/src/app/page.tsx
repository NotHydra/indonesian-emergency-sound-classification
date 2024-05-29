"use client";

import { ChangeEvent, useState } from "react";

export default function Home(): JSX.Element {
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<String>("No file chosen");

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
        if (event.target.files != null && event.target.files[0] != null) {
            setFile(event.target.files[0]);
            setFileName(event.target.files[0].name.length > 50 ? event.target.files[0].name.substring(0, 50) + "..." : event.target.files[0].name);
        } else {
            setFile(null);
            setFileName("No file chosen");
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();

        console.log("File:", file);
    };

    return (
        <>
            <section className="hero home has-background-main is-fullheight">
                <div className="hero-body">
                    <div className="">
                        <p className="title has-text-light mb-1">Indonesian Emergency Sound Classification</p>

                        <p className="subtitle has-text-light mb-4">Upload an audio file below to check for emergency sounds</p>

                        <form onSubmit={handleSubmit}>
                            <div className="file is-light has-name is-right is-fullwidth mb-4">
                                <label className="file-label">
                                    <input className="file-input" type="file" name="file" accept=".mp3" onChange={handleFileChange} />

                                    <span className="file-cta">
                                        <span className="file-icon">
                                            <i className="fas fa-upload"></i>
                                        </span>

                                        <span className="file-label">Choose a file</span>
                                    </span>

                                    <span className="file-name">{fileName}</span>
                                </label>
                            </div>

                            <button className="button is-light" type="submit" disabled={file == null}>
                                <span className="icon">
                                    <i className="fa-solid fa-paper-plane"></i>
                                </span>

                                <span>Send</span>
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="content has-text-centered">
                    <div className="is-size-3 mb-2">
                        <a className="footer-link" href="https://github.com/NotHydra/indonesian-emergency-sound-classification" target="_blank" rel="GitHub">
                            <i className="fa-brands fa-github"></i>
                        </a>
                    </div>

                    <p>
                        <strong>Copyright © 2024</strong> Indonesian Emergency Sound Classification - Kalimantan's Institute of Technology
                    </p>
                </div>
            </footer>
        </>
    );
}
