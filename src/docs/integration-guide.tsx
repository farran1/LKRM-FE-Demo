/**
 * Integration Guide for Offline Live Stat Tracker
 * How to integrate the new offline-first system with existing Statistics component
 */

// 1. Import the services in your Statistics component
import { liveGameDataService } from '@/services/live-game-data-service'
import { useStorageManagement } from '@/hooks/useStorageManagement'
import StorageQuotaManager from '@/components/storage-quota-manager'
import ConflictResolutionModal from '@/components/conflict-resolution-modal'

// 2. Add to your Statistics component (preserve existing UI)
const Statistics = ({ eventId, onExit, autoStart, choice }) => {
  // Existing state and logic...
  
  // Add offline-first data management
  const [liveGameData, setLiveGameData] = useState(null)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const { storageStatus, showStorageManager, setShowStorageManager } = useStorageManagement()

  // Initialize offline-first system
  useEffect(() => {
    const initializeOfflineSystem = async () => {
      try {
        await liveGameDataService.initialize(eventId, choice)
        
        // Listen for data updates
        const unsubscribe = liveGameDataService.addDataListener((data) => {
          setLiveGameData(data)
        })

        return unsubscribe
      } catch (error) {
        console.error('Failed to initialize offline system:', error)
        // Handle initialization error
      }
    }

    const cleanup = initializeOfflineSystem()
    return () => {
      cleanup.then(unsubscribe => unsubscribe?.())
    }
  }, [eventId, choice])

  // Handle game events (replace existing event handlers)
  const handleGameEvent = async (eventData) => {
    try {
      await liveGameDataService.addGameEvent(eventData)
      // Your existing UI update logic can stay the same
    } catch (error) {
      console.error('Failed to add game event:', error)
    }
  }

  // Handle game end
  const handleEndGame = async () => {
    try {
      await liveGameDataService.endGame()
      // Your existing end game logic
    } catch (error) {
      console.error('Failed to end game:', error)
    }
  }

  // Add storage status indicator to your existing UI
  const renderStorageStatus = () => (
    <div style={{ position: 'absolute', top: 10, right: 10 }}>
      <Space>
        {!storageStatus.isOnline && (
          <Tag color="red" icon={<ExclamationCircleOutlined />}>
            Offline
          </Tag>
        )}
        {storageStatus.syncStatus.pendingSyncs > 0 && (
          <Tag color="orange">
            {storageStatus.syncStatus.pendingSyncs} pending syncs
          </Tag>
        )}
        {storageStatus.isNearLimit && (
          <Tag color="red" icon={<WarningOutlined />}>
            Storage Full
          </Tag>
        )}
        <Button
          size="small"
          icon={<DatabaseOutlined />}
          onClick={() => setShowStorageManager(true)}
        >
          Storage
        </Button>
      </Space>
    </div>
  )

  return (
    <div>
      {/* Your existing UI components */}
      
      {/* Add storage status */}
      {renderStorageStatus()}
      
      {/* Add modals */}
      <StorageQuotaManager
        showAsModal={true}
        onClose={() => setShowStorageManager(false)}
      />
      
      <ConflictResolutionModal
        eventId={eventId}
        visible={showConflictModal}
        onResolve={(resolution) => {
          console.log('Conflict resolved:', resolution)
          setShowConflictModal(false)
        }}
        onCancel={() => setShowConflictModal(false)}
      />
    </div>
  )
}

export default Statistics



