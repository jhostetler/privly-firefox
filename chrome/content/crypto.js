// "use strict";

// const EXPORTED_SYMBOLS = ['privlyCrypto'];

// const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
// const module = Cu.import;
// const error = Cu.reportError;

// module("resource://gre/modules/XPCOMUtils.jsm");
// module("resource://gre/modules/Services.jsm");

var privlyCrypto = {

	getFileFromChrome : function( chromeURL )
	{
		// convert the chrome URL into a file URL
		var cr = Components.classes['@mozilla.org/chrome/chrome-registry;1']
				 .getService(Components.interfaces.nsIChromeRegistry);
		var io = Components.classes['@mozilla.org/network/io-service;1']
				 .getService(Components.interfaces.nsIIOService);
		var uri = io.newURI(decodeURI(chromeURL), 'UTF-8', null);
		var fileURL = cr.convertChromeURL(uri);
		// get the nsILocalFile for the file
		return fileURL.QueryInterface(Components.interfaces.nsIFileURL).file.path;
	},
	
	getPlatformDirectoryName : function()
	{
		if( navigator.appVersion.indexOf( "Win" ) != -1 ) {
			return "win32";
		}
		else {
			err = {
				origin : "crypto",
				message : "Unsupported OS: " + navigator.appVersion
			};
			throw err;
		}
	},
	
	getProfileDirectory : function()
	{
		var directoryService =  
			Cc["@mozilla.org/file/directory_service;1"].getService( Ci.nsIProperties );  
		// this is a reference to the profile dir (ProfD) now.  
		var localDir = directoryService.get( "ProfD", Ci.nsIFile );  
		localDir.append("privly");  
  
		if( !localDir.exists() || !localDir.isDirectory() ) {  
			// read and write permissions to owner and group, read-only for others.  
			localDir.create(Ci.nsIFile.DIRECTORY_TYPE, 0774);  
		}
		
		return localDir.path;
	},
	
	init : function( sName )
	{
		if( "nss" == sName ) {
			privlyCrypto._engine = new NssCryptoEngine();
		}
		else {
			var err = {
				origin : "crypto",
				message : "Unsupported backend '" + sName + "'"
			};
			throw err;
		}
	},
	
	CreateSession : function( sConfigDir, sUsername, sPassphrase )
	{
		var pSession = new ctypes.voidptr_t();
		var cConfigDir = ctypes.char.array()( sConfigDir );
		var cUsername = ctypes.char.array()( sUsername );
		var cPassphrase = ctypes.char.array()( sPassphrase );
		var rv = this._engine._CreateSession( 
			cConfigDir, cUsername, cPassphrase, pSession.address() );
		// FIXME: Magic number
		if( 0 != rv ) {
			var err = {
				origin : "crypto",
				code : rv
			};
			throw err;
		}
		
		return pSession;
	},
	
	DestroySession : function( pSession )
	{
		var rv = this._engine._DestroySession( pSession );
		// FIXME: Magic numbers
		// 21 = PRIVLY_CRYPTO_SHUTDOWN_FAIL -> NSS_Shutdown() failed
		//		This happens in Firefox, *possibly* because NSS is already
		//		running in the browser. Although, we use our own DLL, so that
		//		seems a bit odd. See this:
		//		http://groups.google.com/group/mozilla.dev.tech.crypto/browse_thread/thread/275b0f9134ed9fee
		if( 0 != rv && 21 != rv ) {
			var err = {
				origin : "crypto",
				code : rv
			};
			throw err;
		}
	}
};

function NssCryptoEngine()
{
	Components.utils.import( "resource://gre/modules/ctypes.jsm" );
	var root_path = "chrome://privly/content/lib/" + privlyCrypto.getPlatformDirectoryName();
	
	// TODO: This is (still) platform-specific, due to lib names / extensions.
	ctypes.open( privlyCrypto.getFileFromChrome( root_path + "/libnspr4.dll" ) );
	ctypes.open( privlyCrypto.getFileFromChrome( root_path + "/libplc4.dll" ) );
	ctypes.open( privlyCrypto.getFileFromChrome( root_path + "/libplds4.dll" ) );
	ctypes.open( privlyCrypto.getFileFromChrome( root_path + "/nssutil3.dll" ) );
	ctypes.open( privlyCrypto.getFileFromChrome( root_path + "/nss3.dll" ) );
	this._lib = ctypes.open( privlyCrypto.getFileFromChrome( root_path + "/privly.dll" ) );
	
	// TODO: You should generate the declarations from the C header, or
	// generate both from an IDL file.
	
	// Type declarations
	this._PostKeyData = new ctypes.StructType( "privly_PostKeyData", [
		{"type" : ctypes.int},		// Note: Actually an enum
		{"key_data" : ctypes.unsigned_char.ptr},
		{"key_data_len" : ctypes.int},
		{"cipher" : ctypes.int},	// Note: Actually an enum
		{"key_bits" : ctypes.int},
		{"block_bits" : ctypes.int},
		{"iv" : ctypes.unsigned_char.ptr},
		{"iv_len" : ctypes.int},
		{"kdf_iterations" : ctypes.int},
		{"kdf_salt" : ctypes.unsigned_char.ptr},
		{"kdf_salt_len" : ctypes.int}
	] );
	
	// Function declarations
	this._CreateSession = this._lib.declare( "privly_CreateSession", ctypes.default_abi,
		ctypes.int, ctypes.char.ptr, ctypes.char.ptr, ctypes.char.ptr, ctypes.voidptr_t.ptr );
	this._DestroySession = this._lib.declare( "privly_DestroySession", ctypes.default_abi,
		ctypes.int, ctypes.voidptr_t );
}

// -----------------------------------------------------------------------
// CryptoEngine interface
// -----------------------------------------------------------------------

NssCryptoEngine.algorithms = function() 
{

}

NssCryptoEngine.prototype.dispose = function()
{
	this._nss_lib.close();
}

NssCryptoEngine.prototype.encrypt = function( algorithm, pt, ct )
{
	
}

NssCryptoEngine.prototype.decrypt = function( ct, pt )
{

}
