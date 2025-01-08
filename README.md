# First 2 Apply

First 2 Apply (https://first2apply.com/) is an open-source job board aggregator that centralizes listings from platforms like LinkedIn, Indeed, Dice, and more, helping job seekers find opportunities faster.

## Project Setup
The project has 2 main components:
- supabase backend
- desktop probe 

Create `.env` files in both folders by coping the existing `.env.example` ones.

To set up the project using Supabase:
```
npx supabase init
```

You should now be able to visit the Supabase dashboard by visiting http://localhost:54323/
All required tables should already be configured.

Then import the [sites_rows.csv](./supabase/sites_rows.csv) file into the `sites` table in the supabase manager.

Run edge functions with hot reload:
```
npx supabase functions serve
```

Finally, navigate to the `desktopProbe` folder and run:
```
npm run start
```

## Release

First, update the version in `package.json` and also in the `.appx` manifest.

### MacOS
Forge supports automatically uploading the packaged app to S3, but unfortunately the download link is broken because we have whitespaces in the app name. So make sure to edit the generated `REALEASES.json` file with the actual link from S3 and upload it again

Run `npm run package` to test a production build locally first. Don't forget to uncomment the prov ENV vars in the desktop probe.

If everything is ok, then run `npm run publish` to upload a new prod build

To build the x64 version for Intel macs run `npm run publish -- --arch x64`.

### Windows
Updates are handled via the Microsoft store so just build a new AppX and submit it there. The auto-updater only checks the `RELEASES.json` to display a notification that a new version is available

Run `npm run make` to build a new AppX bundle. Upload it manually to the Windows Store.

Add a new version entry to the releases json file from S3.

### Linux
We have to manually upload the `.deb` file to S3 and also manually update the `RELEASES.json` file with the new version.
