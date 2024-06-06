"use client";

import axios, { AxiosResponse } from "axios";
import { ChangeEvent, useState } from "react";

export default function Home(): JSX.Element {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<String>("No file chosen");
    const [fileResponseType, setFileResponseType] = useState<Boolean | null>(null);
    const [fileResponseMessage, setFileResponseMessage] = useState<String | null>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
        if (event.target.files === null || event.target.files.length === 0) {
            setFile(null);
            setFileName("No file chosen");

            return;
        }

        setFile(event.target.files[0]);
        setFileName(event.target.files[0].name.length > 50 ? event.target.files[0].name.substring(0, 50) + "..." : event.target.files[0].name);
    };

    const handleFileSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);

        if (file === null) {
            setFileResponseType(false);
            setFileResponseMessage("Please choose a file");

            return;
        }

        if (["audio/wav"].includes(file.type) === false) {
            setFileResponseType(false);
            setFileResponseMessage("Invalid file type. Please upload a WAV file");

            return;
        }

        const formData: FormData = new FormData();
        formData.append("file", file);

        const response: AxiosResponse<Boolean> = await axios.post("https://emergency-sound-classification-server.up.railway.app/api/classify", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        if (response.data === false) {
            setFileResponseType(false);
            setFileResponseMessage("No emergency sound detected");

            return;
        }

        setFileResponseType(true);
        setFileResponseMessage("Emergency sound detected");
    };

    const handleModalClose = (): void => {
        setIsLoading(false);
        setFileResponseType(null);
        setFileResponseMessage(null);
    };

    return (
        <>
            <section className="hero home has-background-main is-fullheight">
                <div className="hero-body">
                    <div className="">
                        <p className="title has-text-light mb-1">Indonesian Emergency Sound Classification</p>

                        <p className="subtitle has-text-light mb-4">Upload an audio file below to check for emergency sounds</p>

                        <form onSubmit={handleFileSubmit}>
                            <div className="file is-light has-name is-right is-fullwidth mb-4">
                                <label className="file-label">
                                    <input className="file-input" type="file" name="file" accept=".wav" onChange={handleFileChange} />

                                    <span className="file-cta">
                                        <span className="file-icon">
                                            <i className="fas fa-upload"></i>
                                        </span>

                                        <span className="file-label">Choose a file</span>
                                    </span>

                                    <span className="file-name">{fileName}</span>
                                </label>
                            </div>

                            <button className={`button is-light ${isLoading ? "is-loading" : ""}`} type="submit" disabled={file === null}>
                                <span className="icon">
                                    <i className="fa-solid fa-paper-plane"></i>
                                </span>

                                <span>Send</span>
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <div id="upload-modal" className={`modal ${fileResponseMessage !== null ? "is-active" : ""}`}>
                <div className="modal-background"></div>

                <div className="modal-content">
                    <article className={`message ${fileResponseType ? "is-success" : "is-danger"}`}>
                        <div className="message-header">
                            <p className="is-size-4">Response</p>

                            <button className="delete" onClick={handleModalClose}></button>
                        </div>

                        <div className="message-body">
                            <div className="content">
                                <p className="is-size-5">{fileResponseMessage}</p>
                            </div>
                        </div>
                    </article>
                </div>
            </div>

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
