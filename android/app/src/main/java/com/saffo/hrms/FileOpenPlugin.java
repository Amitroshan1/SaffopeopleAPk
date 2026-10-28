package com.saffo.hrms;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.webkit.MimeTypeMap;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

/**
 * Opens a local app file with the system viewer (ACTION_VIEW), not the Share sheet.
 */
@CapacitorPlugin(name = "FileOpen")
public class FileOpenPlugin extends Plugin {

    @PluginMethod
    public void open(PluginCall call) {
        String path = call.getString("path");
        String uriString = call.getString("uri");
        String mimeType = call.getString("mimeType");
        String fileName = call.getString("fileName");

        File file = resolveFile(path, uriString);
        if (file == null || !file.exists() || !file.isFile()) {
            call.reject("File is no longer available on this device.");
            return;
        }

        String mime = resolveMime(mimeType, fileName, file.getName());
        try {
            Uri contentUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                file
            );
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(contentUri, mime);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("No app is available to open this file.");
        } catch (Exception e) {
            call.reject(e.getMessage() != null ? e.getMessage() : "Unable to open file");
        }
    }

    private File resolveFile(String path, String uriString) {
        if (path != null && !path.trim().isEmpty()) {
            File fromPath = new File(getContext().getFilesDir(), path.trim());
            if (fromPath.exists()) {
                return fromPath;
            }
        }
        if (uriString == null || uriString.trim().isEmpty()) {
            return null;
        }
        try {
            Uri uri = Uri.parse(uriString.trim());
            String scheme = uri.getScheme();
            if (scheme == null || "file".equalsIgnoreCase(scheme)) {
                String filePath = uri.getPath();
                if (filePath != null && !filePath.isEmpty()) {
                    return new File(filePath);
                }
            }
        } catch (Exception ignored) {
            // fall through
        }
        return null;
    }

    private String resolveMime(String mimeType, String fileName, String fallbackName) {
        if (mimeType != null && !mimeType.trim().isEmpty()
            && !"application/octet-stream".equalsIgnoreCase(mimeType.trim())) {
            return mimeType.trim();
        }
        String name = fileName != null && !fileName.isEmpty() ? fileName : fallbackName;
        String ext = "";
        int dot = name != null ? name.lastIndexOf('.') : -1;
        if (dot >= 0 && dot < name.length() - 1) {
            ext = name.substring(dot + 1).toLowerCase();
        }
        String fromExt = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
        return fromExt != null ? fromExt : "*/*";
    }
}
