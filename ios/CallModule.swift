import Foundation
import CallKit
import React

@objc(CallModule)
class CallModule: NSObject {
  private let callController = CXCallController()
  
  @objc
  func makeCall(_ phoneNumber: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let handle = CXHandle(type: .phoneNumber, value: phoneNumber)
    let startCallAction = CXStartCallAction(call: UUID(), handle: handle)
    let transaction = CXTransaction(action: startCallAction)
    
    callController.request(transaction) { error in
      if let error = error {
        reject("CALL_ERROR", "Failed to initiate call", error)
      } else {
        resolve(true)
      }
    }
  }
  
  @objc
  func endCall(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let endCallAction = CXEndCallAction(call: UUID())
    let transaction = CXTransaction(action: endCallAction)
    
    callController.request(transaction) { error in
      if let error = error {
        reject("CALL_ERROR", "Failed to end call", error)
      } else {
        resolve(true)
      }
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
} 