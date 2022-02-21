const axios = require("axios").default
const fs = require("fs-extra")
const path = require("path")

async function download () {
    const { platform } = process
    const repoUrl = "https://api.github.com/repos/the-gntl-project/gntl/releases/latest"
    try {
        const pwd = process.cwd()
        const downloadDir = path.join(pwd, "downloads")
        await fs.ensureDir(downloadDir)

        const { data } = await axios.get(repoUrl)
        const url = (data.assets || [])        
            .map(asset => asset["browser_download_url"])
            .find(url => {
                if (platform === "linux") {
                    return url.includes("GNTL-Linux-x86_64")
                } else if (platform === "win32") {
                    return url.includes("GNTL-Windows-x64")
                }
                return url.includes("GNTL-macOS")
            })

        if (!url) { throw new Error("Download url not found for " + process) }
        console.log("Downloading binary at url: " + url)

        const extension = path.extname(url)
        const filePath = path.join(downloadDir, "latest" + extension)
        const { data: artifact } = await axios.get(url, { responseType: "stream" })
        artifact.pipe(fs.createWriteStream(filePath))
        console.log("Downloaded binary to: " + filePath)
    } catch (err) {
        console.error("Failed to download file: " + err)
        process.exit(1)
    }
}

download()
