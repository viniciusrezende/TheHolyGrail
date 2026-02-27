import { ReactText, useEffect, useRef, useState } from "react";
import { toast } from 'material-react-toastify';
import DownloadIcon from '@mui/icons-material/Download';
import packageJson from "../../../package.json";
import { Trans } from "react-i18next";
import { Button } from "@mui/material";
import { Progress } from "electron-dl";

const GITHUB_LATEST_RELEASE = 'https://api.github.com/repos/csvon/TheHolyGrail-RotW/releases/latest';
const MANUAL_UPDATE_CHECK_EVENT = 'thg:check-updates';

type GitHubRelease = {
    name: string,
    assets: Array<{
        browser_download_url: string,
    }>,
}

const isNewVersionAvailable = (currentVersion:string, candidateVersion: string): boolean => {
    if (currentVersion === candidateVersion) return false;
    const candidate = candidateVersion.replace('v', '').split('.');
    const current = currentVersion.replace('v', '').split('.');
    for (let i = 0; i < current.length; i++) {
        const a = current[i] ? parseInt(current[i]) : 0;
        const b = candidate[i] ? parseInt(candidate[i]) : 0;
        if (a > b) return false;
        if (a < b) return true;
    }
    return false;
}

const VersionCheck = () => {
    const toastId = useRef<ReactText|null>(null);
    const [ newVersionUrl, setNewVersionUrl ] = useState('');
    const [ isDownloading, setIsDownloading ] = useState(false);
    const currentVersion = packageJson.version;

    const NewVersionButton = () => {
        return <div style={{ paddingRight: 15 }}>
            <Button
                onClick={() => {
                    window.Main.downloadNewVersion(newVersionUrl);
                    setIsDownloading(true);
                }}
                variant="text"
                sx={{
                    textTransform: 'none',
                    fontWeight: 'normal',
                    color: '#ddd',
                }}
            >
                <DownloadIcon/>
                <Trans>New version is available, click here to download.</Trans>
            </Button>
        </div>
    }

    const toastNewVersionButton = (): ReactText => {
        if (toastId.current) {
            toast.update(toastId.current, {
                render: <NewVersionButton />,
                hideProgressBar: true,
                progress: 0,
            });
            return '';
        } else {
            return toast(<NewVersionButton />, {
                position: "bottom-center",
                autoClose: false,
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: false,
                type: "dark"
            });
        }
    }

    const checkForUpdates = (manual = false) => {
        fetch(GITHUB_LATEST_RELEASE)
            .then((response) => response.json())
            .then((release: GitHubRelease & { message?: string }) => {
                if (!release?.name || !Array.isArray(release.assets)) {
                    if (manual) {
                        toast.error('Could not check for updates.');
                    }
                    return;
                }

                if (isNewVersionAvailable(currentVersion, release.name)) {
                    const isWin = window.Main.isWindows();
                    const setupAsset = release.assets.find(asset => asset.browser_download_url.includes(isWin ? 'win' : 'darwin'));
                    if (setupAsset) {
                        setNewVersionUrl(setupAsset.browser_download_url);
                    } else if (manual) {
                        toast.info('Update found, but no installer was found for this platform.');
                    }
                    return;
                }

                if (manual) {
                    toast.info(`You are on the latest version (v${currentVersion}).`);
                }
            })
            .catch(() => {
                if (manual) {
                    toast.error('Could not check for updates.');
                }
                console.log('Could not check for new version');
            });
    };

    useEffect(() => {
        const handleManualUpdateCheck = () => {
            checkForUpdates(true);
        };

        checkForUpdates(false);
        window.addEventListener(MANUAL_UPDATE_CHECK_EVENT, handleManualUpdateCheck);

        window.Main.on('downloadProgress', (progress: Progress) => {
            if(toastId.current !== null) {
                toast.update(toastId.current, {
                    hideProgressBar: false,
                    progress: progress.percent,
                    render: <Button onClick={() => {
                        window.Main.cancelDownload();
                        setIsDownloading(false);
                    }}>
                        <Trans>Downloading installer... Click here to cancel</Trans>
                    </Button>,
                });
            }
        });

        return () => {
            window.removeEventListener(MANUAL_UPDATE_CHECK_EVENT, handleManualUpdateCheck);
        };
    }, []);

    useEffect(() => {
        if (newVersionUrl !== '' && !isDownloading) {
            if (!toastId.current) {
                toastId.current = toastNewVersionButton();
            } else {
                toastNewVersionButton();
            }
        }
    }, [ isDownloading, newVersionUrl ]);

    return null;
}

export default VersionCheck;
