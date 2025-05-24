import * as core from "@actions/core";

export async function prepareMcpConfig(
  githubToken: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<string> {
  try {
    const defaultMcpConfig = {
      mcpServers: {
        github: {
          command: "docker",
          args: [
            "run",
            "-i",
            "--rm",
            "-e",
            "GITHUB_PERSONAL_ACCESS_TOKEN",
            "ghcr.io/anthropics/github-mcp-server:sha-7382253",
          ],
          env: {
            GITHUB_PERSONAL_ACCESS_TOKEN: githubToken,
          },
        },
        github_file_ops: {
          command: "bun",
          args: [
            "run",
            `${process.env.GITHUB_ACTION_PATH}/src/mcp/github-file-ops-server.ts`,
          ],
          env: {
            GITHUB_TOKEN: githubToken,
            REPO_OWNER: owner,
            REPO_NAME: repo,
            BRANCH_NAME: branch,
            REPO_DIR: process.env.GITHUB_WORKSPACE || process.cwd(),
          },
        },
      },
    };

    // Parse and merge user-provided MCP configuration if available
    const userMcpConfigStr = process.env.USER_MCP_CONFIG;
    let finalMcpConfig = defaultMcpConfig;
    
    if (userMcpConfigStr && userMcpConfigStr.trim() !== "") {
      try {
        const userMcpConfig = JSON.parse(userMcpConfigStr);
        
        // Deep merge the configurations
        finalMcpConfig = {
          mcpServers: {
            ...defaultMcpConfig.mcpServers,
            ...(userMcpConfig.mcpServers || {}),
          },
        };
        
        console.log("Merged MCP configuration with user-provided config");
      } catch (parseError) {
        core.warning(`Failed to parse user MCP config: ${parseError}. Using default configuration.`);
      }
    }

    return JSON.stringify(finalMcpConfig, null, 2);
  } catch (error) {
    core.setFailed(`Install MCP server failed with error: ${error}`);
    process.exit(1);
  }
}
