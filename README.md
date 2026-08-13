# Attendance Dashboard

A lightweight, local-storage based attendance tracking web app.

## Deployment to Render

This project is fully configured for deployment on [Render](https://render.com/) as a **Static Site**.

### Steps to Deploy:
1. Push this folder to a GitHub, GitLab, or Bitbucket repository.
2. Go to the [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** and select **Blueprint**.
4. Connect the repository you just created.
5. Render will automatically read the `render.yaml` file and deploy the project as a blazing-fast static site.

### Alternatively (Manual Deployment):
1. In the Render Dashboard, click **New +** and select **Static Site**.
2. Connect your repository.
3. Leave the **Build Command** empty.
4. Set the **Publish directory** to `.` (the root folder).
5. Click **Create Static Site**.
