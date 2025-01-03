export interface VideoPart {
    startTime: number;       // Start time in seconds
    endTime: number;         // End time in seconds
    htmlFileUrl: string;     // URL for the corresponding HTML file
    paused?: boolean;         // Pause the video at the start of the part
}

export interface VideoData {
    videoUrl: string;        // URL for the video
    screenSize: {
        width: number;       // Screen width
        height: number;      // Screen height
    };
    htmlFileUrl: string;     // Default HTML file for the video
    ccFileUrl: string;       // Closed captions file URL
    videoParts: VideoPart[]; // Dynamic video parts with associated HTML content
}
