import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const page = (name: string) => fileURLToPath(new URL(name, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Dev convenience: proxy API calls to the Go backend so the frontend can
      // use same-origin requests during development.
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2021',
    rollupOptions: {
      // Multi-page app: every HTML entry point is built independently.
      input: {
        home: page('index.html'),
        about: page('about.html'),
        projects: page('projects.html'),
        projectDetail: page('project-detail.html'),
        resume: page('resume.html'),
        contact: page('contact.html'),
        notFound: page('404.html'),
        adminDashboard: page('admin/index.html'),
        adminProjects: page('admin/projects.html'),
        adminProfile: page('admin/profile.html'),
        adminSkills: page('admin/skills.html'),
        adminEducation: page('admin/education.html'),
        adminExperience: page('admin/experience.html'),
        adminCertificates: page('admin/certificates.html'),
        adminSocialLinks: page('admin/social-links.html'),
        adminMessages: page('admin/messages.html'),
        adminSettings: page('admin/settings.html'),
      },
    },
  },
  preview: { port: 4173 },
});
