export default function Home(): JSX.Element {
    return (
        <section className="section">
            <div className="container">
                <h1 className="title">Upload MP3 File</h1>

                <div className="file is-boxed">
                    <label className="file-label">
                        <input className="file-input" type="file" name="mp3File" accept=".mp3" />

                        <span className="file-cta">
                            <span className="file-icon">
                                <i className="fas fa-upload"></i>
                            </span>

                            <span className="file-label">Choose a file…</span>
                        </span>
                    </label>
                </div>

                <button className="button is-primary">Upload</button>
            </div>
        </section>
    );
}
