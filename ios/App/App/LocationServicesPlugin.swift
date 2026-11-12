
import Foundation
import CoreLocation
import UIKit
import Capacitor

@objc(LocationServicesPlugin)
public class LocationServicesPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "LocationServicesPlugin"
    public let jsName = "LocationServices"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isLocationEnabled", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openAppSettings", returnType: CAPPluginReturnPromise)
    ]

    @objc func isLocationEnabled(_ call: CAPPluginCall) {
        let enabled = CLLocationManager.locationServicesEnabled()

        call.resolve([
            "enabled": enabled
        ])
    }

    @objc func openAppSettings(_ call: CAPPluginCall) {
        guard let settingsURL = URL(string: UIApplication.openSettingsURLString) else {
            call.reject("Unable to open app settings")
            return
        }

        DispatchQueue.main.async {
            UIApplication.shared.open(settingsURL) { success in
                if success {
                    call.resolve()
                } else {
                    call.reject("Unable to open app settings")
                }
            }
        }
    }
}
