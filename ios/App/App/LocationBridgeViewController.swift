
import Capacitor

class LocationBridgeViewController: CAPBridgeViewController {

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(LocationServicesPlugin())
    }
}
