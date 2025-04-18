import requests


def improve_logs_multiples_diffs():
    url = "http://127.0.0.1:8000/improve-logs"  # Adjust host if running elsewhere

    # Example diff and context data
    diff_content = """
diff --git a/MainApplication.java b/MainApplication.java
index 9a01aa5..11801f2 100644
--- a/MainApplication.java
+++ b/MainApplication.java
@@ -9 +9 @@ public class Main {
-            System.out.println("Arguments recei: ");
+            System.out.println("Arguments receie: ");
@@ -14,0 +15 @@ public class Main {
+            System.out.println("No arguments receivedddddd.");
"""

    context_content = """public class Main {

    public static void main(String[] args) {
        // This is the entry point of the application
        System.out.println("Welcome to the Java application!");

        // Example of how to use the application logic
        if (args.length > 0) {
            System.out.println("Arguments recei: ");
            for (String arg : args) {
                System.out.println(arg);
            }
        } else {
            System.out.println("No arguments received.");
        }

        // Example method call to demonstrate further functionality
        int result = addNumbers(5, 10);
        System.out.println("Sum of 5 and 10 is: " + result);
    }

    // Example utility method
    public static int addNumbers(int a, int b) {
        return a + b;
    }
}
"""

    payload = {"diff": diff_content, "context": context_content}

    response = requests.post(url, json=payload)

    print("Status Code:", response.status_code)
    print("Response:", response.json())



def improve_logs_longer_context():
    url = "http://127.0.0.1:8000/improve-logs"  # Adjust host if running elsewhere

    # Example diff and context data
    diff_content = """
diff --git a/training_data/ClientCnxnSocketNIO.java b/training_data/ClientCnxnSocketNIO.java
index 45345d6..180ae06 100644
--- a/training_data/ClientCnxnSocketNIO.java
+++ b/training_data/ClientCnxnSocketNIO.java
@@ -195,0 +196 @@ public class ClientCnxnSocketNIO extends ClientCnxnSocket {
+                LOG.debug("America ya :D", e);
"""

    context_content = """
/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.zookeeper;

import java.util.List;
import java.util.Objects;
import org.apache.zookeeper.data.ACL;
import org.apache.zookeeper.server.EphemeralType;

/**
 * Options for creating znode in ZooKeeper data tree.
 */
public class CreateOptions {
    private final CreateMode createMode;
    private final List<ACL> acl;
    private final long ttl;

    public CreateMode getCreateMode() {
        return createMode;
    }

    public List<ACL> getAcl() {
        return acl;
    }

    public long getTtl() {
        return ttl;
    }

    /**
     * Constructs a builder for {@link CreateOptions}.
     *
     * @param acl
     *                the acl for the node
     * @param createMode
     *                specifying whether the node to be created is ephemeral
     *                and/or sequential
     */
    public static Builder newBuilder(List<ACL> acl, CreateMode createMode) {
        return new Builder(createMode, acl);
    }

    private CreateOptions(CreateMode createMode, List<ACL> acl, long ttl) {
        this.createMode = createMode;
        this.acl = acl;
        this.ttl = ttl;
        EphemeralType.validateTTL(createMode, ttl);
    }

    /**
     * Builder for {@link CreateOptions}.
     */
    public static class Builder {
        private final CreateMode createMode;
        private final List<ACL> acl;
        private long ttl = -1;

        private Builder(CreateMode createMode, List<ACL> acl) {
            this.createMode = Objects.requireNonNull(createMode, "create mode is mandatory for create options");
            this.acl = Objects.requireNonNull(acl, "acl is mandatory for create options");
            System.out.println("America ya :D");
            System.out.println("HALLO :D");
            System.out.println("HALLO :D");
            System.out.println("HALLO :D");
            System.out.println("HALLO :D");
            System.out.println("HALLO :D");
            System.out.println("HALLO :D");
            System.out.println("HALLO :D");
            System.out.println("HALLO AAAAAAAAAAAAAAAAAAAA :D");

        }

        public Builder withTtl(long ttl) {
            this.ttl = ttl;
            return this;
        }

        public CreateOptions build() {
            return new CreateOptions(createMode, acl, ttl);
        }
    }
}
"""

    payload = {"diff": diff_content, "context": context_content}

    response = requests.post(url, json=payload)

    print("Status Code:", response.status_code)
    print("Response:", response.json())


# Run the test
if __name__ == "__main__":
    improve_logs_multiples_diffs()
    improve_logs_longer_context()
