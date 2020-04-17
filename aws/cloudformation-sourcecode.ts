import { SourceCodeApp } from './app/sourcecode';

(async () => {
    new SourceCodeApp().synth();
})().catch(console.error);
