+++
author = "Roman Zaynetdinov"
date = 2021-02-19T12:00:00+03:00
title = "Configure commons-configuration2 with file reload"
+++

We have been migrating to Apache commons-configuration2. It turned out to be rather painful. 

Some of the changes:

* The API to build a Configuration has changed significantly
* You now need to hold a builder if you wan to apply changes to the Configuration
* Configuration is immutable

Due to the changes we had to create a wrapper around Configuration. Previously, we simply included Configuration class everywhere.


```java
package com.zaynetro.config;

import org.apache.commons.configuration2.Configuration;
import org.apache.commons.configuration2.PropertiesConfiguration;
import org.apache.commons.configuration2.builder.ConfigurationBuilder;
import org.apache.commons.configuration2.builder.ConfigurationBuilderEvent;
import org.apache.commons.configuration2.builder.ReloadingFileBasedConfigurationBuilder;
import org.apache.commons.configuration2.builder.fluent.Parameters;
import org.apache.commons.configuration2.convert.LegacyListDelimiterHandler;
import org.apache.commons.configuration2.event.EventListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReloadableConfig {
    private static final Logger LOG = LoggerFactory.getLogger( ReloadableConfig.class );

    // Hold a builder.
    private final ConfigurationBuilder<PropertiesConfiguration> configBuilder;

    public ReloadableConfig( final String configFileName ) throws ConfigurationException {
        try {
            Parameters params = new Parameters();
            // Create a builder that reads configuration from the property file and supports reloading.
            ReloadingFileBasedConfigurationBuilder<PropertiesConfiguration> builder = new ReloadingFileBasedConfigurationBuilder<>(
                    PropertiesConfiguration.class )
                            .configure( params.fileBased().setFileName( configFileName )
                                    // Support comma separated list values. Legacy handler should read list the same was
                                    // as commons-configuration did.
                                    .setListDelimiterHandler( new LegacyListDelimiterHandler( ',' ) ) );

            // Listen to the events which are triggered every time configuration is requested.
            builder.addEventListener( ConfigurationBuilderEvent.CONFIGURATION_REQUEST,
                    new EventListener<ConfigurationBuilderEvent>() {
                        @Override
                        public void onEvent( ConfigurationBuilderEvent event ) {
                            // Check if configuration should be reloaded. This call also resets the reloading controller so that
                            // it could be used again to notice file changes.
                            if( builder.getReloadingController().checkForReloading( null ) ) {
                                LOG.info( "Configuration '{}' has been updated.", configFileName );
                            }
                        }
                    } );

            // Test the configuration could be built
            builder.getConfiguration();
            this.configBuilder = builder;
        } catch( org.apache.commons.configuration2.ex.ConfigurationException e ) {
            throw new ConfigurationException( e );
        }
    }

    private Configuration getConfig() {
        try {
            return configBuilder.getConfiguration();
        } catch( org.apache.commons.configuration2.ex.ConfigurationException e ) {
            throw new RuntimeException( e );
        }
    }

    /**
     * Get a string associated with the given configuration key.
     */
    public String getString( final String key ) {
        return getConfig().getString( key );
    }

    /**
     * Configuration failed to be instantiated.
     */
    public static class ConfigurationException extends Exception {
        private static final long serialVersionUID = -3960087055120317691L;

        ConfigurationException( org.apache.commons.configuration2.ex.ConfigurationException e ) {
            super( e );
        }
    }

}
```

## Other notes

If you want to support merging properties from multiple files then you can either use `ReloadingCombinedConfigurationBuilder` or `ReloadingMultiFileConfigurationBuilder`. 
For the former you need to specify an XML file with the configuration (yeah in 2021 still XML config) and the latter I just couldn't figure out how to use...


## Misc

Configuration2 docs is supposedly for the users but I have had a really hard time trying to follow the story there.

Some quotes from the [User's Guide](https://commons.apache.org/proper/commons-configuration/userguide/user_guide.html):

> The next component taking part in reloading is an instance of the ReloadingController class. This is a fully functional class implementing a generic protocol for executing a reload check (based on an external trigger) and reacting accordingly. The actual check whether a reload is required is delegated to a ReloadingDetector associated with the controller. When the detector reports a change a corresponding notification is sent out to registered reloading listeners. Like ReloadingDetector, a reloading controller does not actively monitor a certain resource; it has a checkForReloading() method which has to be invoked in order to trigger a reloading check. If this method returns true, the controller changes into the so-called reloading state. This means that the need for a reload was detected and now the reload has actually to happen. Typically, this is done by one of the ReloadingListener objects registered at the controller. As long as the controller is in reloading state, no further changes on the configuration source monitored by the associated ReloadingDetector are detected. A manual invocation of the resetReloadingState() method is necessary to terminate this state and enable the detection of further changes.

This is just the beginning...

> The components discussed so far only perform reload checks on demand. In order to implement automatic reloading, ....

There must be a Factory somewhere. Oh here it is.

> ReloadingFileBasedConfigurationBuilder already creates a ReloadingController and initializes it with a ReloadingDetector that is associated with the file managed by the builder. (Actually, the situation is a bit more complex: the creation of the reloading detector is delegated to an object implementing the ReloadingDetectorFactory interface. The factory to be used can be configured via the builder's initialization parameters. Per default, a DefaultReloadingDetectorFactory object is used which creates an instance of the FileHandlerReloadingDetector class. Such an object can detect changes on a file referenced by a FileHandler.) 

Sounds a lot like ["Turbo Encabulator"](https://www.youtube.com/watch?v=Ac7G7xOG2Ag).
