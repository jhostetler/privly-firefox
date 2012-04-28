var privlyCrypto = {

	getEngine : function()
	{
		let directoryService =  
			Cc["@mozilla.org/file/directory_service;1"].getService( Ci.nsIProperties );  
		// this is a reference to the profile dir (ProfD) now.  
		let localDir = directoryService.get( "ProfD", Ci.nsIFile );  
		localDir.append("privly");  
  
		if( !localDir.exists() || !localDir.isDirectory() ) {  
			// read and write permissions to owner and group, read-only for others.  
			localDir.create(Ci.nsIFile.DIRECTORY_TYPE, 0774);  
		}  
		
		// For now, we'll always load the NSS reference implementation.
		// In later versions, you'll want some sort of discovery mechanism.
		return new NssCryptoEngine( localDir.path )
	}
	
}

function NssCryptoEngine( config_dir )
{
	Components.utils.import( "resource://gre/modules/ctypes.jsm" );
	// TODO: Softcoded path
	this._nss_lib = ctypes.open( "chrome://privly/content/lib/nss3.dll" );
}

// -----------------------------------------------------------------------
// CryptoEngine interface
// -----------------------------------------------------------------------

NssCryptoEngine.algorithms = function() 
{

}

NssCryptoEngine.prototype.dispose = function()
{
	this._nss_lib.close()
}

NssCryptoEngine.prototype.encrypt = function( algorithm, pt, ct )
{
	
}

NssCryptoEngine.prototype.decrypt = function( ct, pt )
{

}
