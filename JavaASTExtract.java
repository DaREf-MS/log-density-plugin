// package org.example;


import com.github.javaparser.JavaParser;
import com.github.javaparser.Range;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.VariableDeclarator;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.stmt.*;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import com.opencsv.CSVWriter;

import javax.lang.model.SourceVersion;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.nio.file.Paths;
import java.nio.file.Path;

public class JavaASTExtract {
    private static List<String> getAllFilesInFolderAndSubfolders(File folder) {
        List<String> fileList = new ArrayList<>();
        fileList = getAllFilesRecursive(folder, fileList);
        return fileList;
    }

    private static List<String> getAllFilesRecursive(File folder, List<String> fileList) {
        File[] arr = folder.listFiles();
        if (arr == null) {
            return fileList; // In case of a non-readable folder
        }

        for (File file : arr) {
            if (file.isFile() && file.toString().endsWith(".java")) {
                fileList.add(file.toString());
            } else if (file.isDirectory()) {
                fileList = getAllFilesRecursive(file, fileList);
            }
        }
        return fileList;
    }

    private static String readFile(String filePath){
        String fileContent = "";
        try (Scanner reader = new Scanner(new FileReader(filePath));) {
            while (reader.hasNextLine()){
                fileContent += reader.nextLine().replaceAll("\n", " ") + "\n";
            }
        } catch (FileNotFoundException e) {
            System.out.println(filePath + " : PATH INCORRECT");
            System.exit(1);
        }
        return fileContent;
    }
    private static double logDensity(String filepath){
        String lines = readFile(filepath);
        double logLines = 0.0;
        double loc = 0.0;
        String logPattern = ".*\\b(log|console|logger)\\s*\\.\\s*(trace|fatal|critical|error|warn|info|debug|exception)\\s*\\(.*";
        Pattern pattern = Pattern.compile(logPattern, Pattern.CASE_INSENSITIVE);
        for (String line : lines.split("\n")){
            loc++;
            Matcher matcher = pattern.matcher(line);
            if (matcher.find()) logLines++;
        }
        return 100.0* logLines/loc;
    }
    private static boolean isLogged(String block){
        String logPattern = ".*\\b(log|console|logger)\\s*\\.\\s*(trace|fatal|critical|error|warn|info|debug|exception)\\s*\\(.*";
        Pattern pattern = Pattern.compile(logPattern, Pattern.CASE_INSENSITIVE);
        for (String line : block.split("\n")){
            Matcher matcher = pattern.matcher(line);
            if (matcher.find()) return true;
        }
        return false;
    }

    public static void main(String[] args) throws Exception {
        String project = args[0];
        
        Path path = Paths.get(project);
        System.out.println(path.toAbsolutePath().toString());
        CSVWriter writer = new CSVWriter(new FileWriter(
            Paths.get(path.getParent().toAbsolutePath(), path.getFileName().toString() + "_MLdata_FileLevel.csv").toString()
            ));
        String[] header = {"filename", "block", "syn_feat", "sem_feat", "logDensity"};
        writer.writeNext(header);

        String projectPath = System.getProperty("user.dir") + "/" + project;
        List<String> files = getAllFilesInFolderAndSubfolders(new File(projectPath));
        double counter = 0.0;
        for (String file : files){
            counter++;
            System.out.print(String.format("%.2f", 100*counter/files.size()) + "%  ");
            System.out.println(file);
            List<MyBlock> blocks = new ArrayList<>();

            try {
                CompilationUnit cu = new JavaParser().parse(new File(file)).getResult().orElseThrow(() -> new RuntimeException("Parsing failed"));
                cu.accept(new VoidVisitorAdapter<Void>() {
                    int currentMethodStartLine = -1;
                    @Override
                    public void visit(MethodDeclaration n, Void arg) {
                        Range blockRange =  n.getRange().orElse(null);
                        if (blockRange != null) {
                            currentMethodStartLine = blockRange.begin.line;


                            List<String> semFeat = extractSemanticFeatures(n.toString());
                            List<String> synFeat = extractSyntacticFeaturesFromMethod(n);
                            synFeat.add(0, "MethodDeclaration");

                            MyBlock block = new MyBlock("Method", blockRange.begin.line, blockRange.begin.line, blockRange.end.line);
                            block.semanticFeatures = semFeat;
                            block.syntacticFeatures = synFeat;
                            block.isLogged = isLogged(n.toString());
                            block.logDensity = logDensity(file);
                            blocks.add(block);

                        }
                        super.visit(n, arg);
                    }
                    @Override
                    public void visit(TryStmt n, Void arg) {

                        Range blockRange =  n.getRange().orElse(null);
                        if (blockRange != null) {
                            List<String> semFeat = extractSemanticFeatures(n.toString());

                            List<String> synFeat = new ArrayList<>();

                            for (Expression expression : n.getResources()) {
                                synFeat.add(expression.getMetaModel().toString());
                                for (Node childNode : expression.getChildNodes()) {
                                    try {
                                        if (((VariableDeclarator) childNode).getInitializer().isPresent()) {
                                            synFeat.add(((VariableDeclarator) childNode).getInitializer().get().getMetaModel().toString());
                                        }
                                    } catch (Exception e) {
                                       //pass
                                    }

                                }
                            }
                            for (Statement subStatement : n.getTryBlock().getStatements()) {
                                synFeat = recursivelyCollectSynFeatFromStatement(subStatement, synFeat);
                            }

                            MyBlock block = new MyBlock("Try", currentMethodStartLine, blockRange.begin.line, blockRange.end.line);

                            block.semanticFeatures = semFeat;
                            block.syntacticFeatures = synFeat;
                            blocks.add(block);
                        }
                        super.visit(n, arg);
                    }
                    @Override
                    public void visit(IfStmt n, Void arg) {
                        Range blockRange =  n.getRange().orElse(null);
                        if (blockRange != null) {
                            List<String> semFeat = extractSemanticFeatures(n.toString());

                            List<String> synFeat = new ArrayList<>();
                            synFeat = recursivelyCollectSynFeatFromIFStatement(n, synFeat);

                            MyBlock block = new MyBlock("If", currentMethodStartLine, blockRange.begin.line, blockRange.end.line);
                            block.semanticFeatures = semFeat;
                            block.syntacticFeatures = synFeat;
                            blocks.add(block);
                        }
                        super.visit(n, arg);
                    }

                    @Override
                    public void visit(SwitchStmt n, Void arg) {
                        Range blockRange =  n.getRange().orElse(null);
                        if (blockRange != null) {
                            List<String> semFeat = extractSemanticFeatures(n.toString());

                            List<String> synFeat = new ArrayList<>();

                            synFeat.add("SwitchStmt");
                            synFeat.add(((SwitchStmt) n).getSelector().getMetaModel().toString());
                            for(SwitchEntry switchEntry : ((SwitchStmt) n).getEntries()){
                                for (Statement subStatement : switchEntry.getStatements()){
                                    synFeat = recursivelyCollectSynFeatFromStatement(subStatement, synFeat);
                                }
                            }

                            MyBlock block = new MyBlock("Switch", currentMethodStartLine, blockRange.begin.line, blockRange.end.line);
                            block.semanticFeatures = semFeat;
                            block.syntacticFeatures = synFeat;
                            blocks.add(block);
                        }
                        super.visit(n, arg);
                    }

                    @Override
                    public void visit(ForStmt n, Void arg) {
                        Range blockRange =  n.getRange().orElse(null);
                        if (blockRange != null) {

                            List<String> semFeat = extractSemanticFeatures(n.toString());

                            List<String> synFeat = new ArrayList<>();


                            if (n.getBody().isBlockStmt()){
                                for(Statement statement : n.getBody().asBlockStmt().getStatements()){
                                    synFeat = recursivelyCollectSynFeatFromStatement(statement, synFeat);
                                }
                            } else if (n.getBody().isExpressionStmt()){
                                synFeat.add(n.getBody().asExpressionStmt().getMetaModel().toString());
                            }

                            MyBlock block = new MyBlock("For", currentMethodStartLine, blockRange.begin.line, blockRange.end.line);
                            block.semanticFeatures = semFeat;
                            block.syntacticFeatures = synFeat;
                            blocks.add(block);

                        }
                        super.visit(n, arg);
                    }

                    @Override
                    public void visit(ForEachStmt n, Void arg) {
                        Range blockRange =  n.getRange().orElse(null);
                        if (blockRange != null) {

                            List<String> semFeat = extractSemanticFeatures(n.toString());

                            List<String> synFeat = new ArrayList<>();


                            if (n.getBody().isBlockStmt()){
                                for(Statement statement : n.getBody().asBlockStmt().getStatements()){
                                    synFeat = recursivelyCollectSynFeatFromStatement(statement, synFeat);
                                }
                            } else if (n.getBody().isExpressionStmt()){
                                synFeat.add(n.getBody().asExpressionStmt().getMetaModel().toString());
                            }

                            MyBlock block = new MyBlock("ForEach", currentMethodStartLine, blockRange.begin.line, blockRange.end.line);
                            block.semanticFeatures = semFeat;
                            block.syntacticFeatures = synFeat;
                            blocks.add(block);

                        }
                        super.visit(n, arg);
                    }

                    @Override
                    public void visit(WhileStmt n, Void arg) {
                        Range blockRange =  n.getRange().orElse(null);
                        if (blockRange != null) {
                            List<String> semFeat = extractSemanticFeatures(n.toString());
                            List<String> synFeat = new ArrayList<>();
                            synFeat.add(n.getCondition().getMetaModel().toString());
                            if (n.getBody().isBlockStmt()){
                                for(Statement subStatement : n.getBody().asBlockStmt().getStatements()){
                                    synFeat = recursivelyCollectSynFeatFromStatement(subStatement, synFeat);
                                }
                            } else if (n.getBody().isExpressionStmt()){
                                synFeat.add(n.getBody().asExpressionStmt().getMetaModel().toString());
                            }

                            MyBlock block = new MyBlock("While", currentMethodStartLine, blockRange.begin.line, blockRange.end.line);
                            block.semanticFeatures = semFeat;
                            block.syntacticFeatures = synFeat;
                            blocks.add(block);
                        }
                        super.visit(n, arg);
                    }

                    private List<String> extractSyntacticFeaturesFromMethod(MethodDeclaration n){
                        List<String> synFeat = new ArrayList<>();
                        if(n.getBody().isPresent()){
                            for (Statement statement : n.getBody().get().getStatements()){
                                synFeat = recursivelyCollectSynFeatFromStatement(statement, synFeat);
                            }
                        }
                        return synFeat;
                    }
                    private List<String> collectSynFeatFromStatement(Statement statement, List<String> synFeat){
                        if (getStatementType(statement).equals("ExpressionStmt")) {
                            synFeat.add(statement.asExpressionStmt().getExpression().getMetaModel().toString());
                            for(Node n : statement.asExpressionStmt().getExpression().getChildNodes()){
                                try {
                                    if(((VariableDeclarator)n).getInitializer().isPresent()) {
                                        synFeat.add(((VariableDeclarator)n).getInitializer().get().getMetaModel().toString());
                                    }
                                } catch (Exception e){
//                                        //pass
                                }
                            }
                        } else if (getStatementType(statement).equals("ReturnStmt")) {
                            synFeat.add("ReturnStmt");
                            synFeat.add(statement.asReturnStmt().getExpression().get().getMetaModel().toString());
                        }
                        else {
                            if(!getStatementType(statement).equals("UnparsableStmt")){
                                synFeat.add(getStatementType(statement));
                            }
                        }
                        return synFeat;
                    }
                    private List<String> recursivelyCollectSynFeatFromStatement(Statement statement, List<String> synFeat){
                        if (statement instanceof TryStmt) {
                            synFeat.add("TryStmt");
                            for (Expression expression : ((TryStmt) statement).getResources()) {
                                synFeat.add(expression.getMetaModel().toString());
                                for (Node childNode : expression.getChildNodes()) {
                                    try {
                                        if (((VariableDeclarator) childNode).getInitializer().isPresent()) {
                                            synFeat.add(((VariableDeclarator) childNode).getInitializer().get().getMetaModel().toString());
                                        }
                                    } catch (Exception e) {
                                        //pass
                                    }
                                }
                            }
                            for (Statement subStatement : ((TryStmt) statement).getTryBlock().getStatements()) {
                                synFeat = recursivelyCollectSynFeatFromStatement(subStatement, synFeat);
                            }
                        } else if (statement instanceof SwitchStmt){
                            synFeat.add("SwitchStmt");
                            synFeat.add(((SwitchStmt) statement).getSelector().getMetaModel().toString());
                            for(SwitchEntry switchEntry : ((SwitchStmt) statement).getEntries()){
                                for (Statement subStatement : switchEntry.getStatements()){
                                    synFeat = recursivelyCollectSynFeatFromStatement(subStatement, synFeat);
                                }
                            }

                        } else if (statement instanceof IfStmt){
                            synFeat.add("IfStmt");
                            //Condition
                            synFeat.add(((IfStmt) statement).getCondition().getMetaModel().toString());
                            //If Statement
                            if (((IfStmt) statement).getThenStmt().isBlockStmt()){
                                for (Statement subStatement : ((IfStmt) statement).getThenStmt().asBlockStmt().getStatements()){
                                    synFeat = recursivelyCollectSynFeatFromStatement(subStatement, synFeat);
                                }
                            } else if (((IfStmt) statement).getThenStmt().isBreakStmt()){
                                synFeat.add(((IfStmt) statement).getThenStmt().getMetaModel().toString());
                            }
                            //Else Statement
                            if (((IfStmt) statement).getElseStmt().isPresent()){
                                synFeat.add("ElseStmt");
                                Statement elseStatement = ((IfStmt) statement).getElseStmt().get();
                                if(elseStatement.isIfStmt()){
                                    synFeat = recursivelyCollectSynFeatFromStatement(elseStatement,synFeat);
                                } else if(elseStatement.isBlockStmt()){
                                    for (Statement subStatement : ((IfStmt) statement).getElseStmt().get().asBlockStmt().getStatements()) {
                                        synFeat = recursivelyCollectSynFeatFromStatement(subStatement, synFeat);
                                    }
                                } else {
                                    synFeat.add(elseStatement.getMetaModel().toString());
                                }
                            }
                        } else if (statement instanceof ForStmt){
                            synFeat.add("ForStmt");
                            if (((ForStmt) statement).getBody().isBlockStmt()){
                                for(Statement subStatement : ((ForStmt) statement).getBody().asBlockStmt().getStatements()){
                                    synFeat = recursivelyCollectSynFeatFromStatement(subStatement, synFeat);
                                }
                            } else if (((ForStmt) statement).getBody().isExpressionStmt()){
                                synFeat.add(((ForStmt) statement).getBody().asExpressionStmt().getMetaModel().toString());
                            }
                        } else if (statement instanceof ForEachStmt){
                            synFeat.add("ForEachStmt");
                            if (((ForEachStmt) statement).getBody().isBlockStmt()){
                                for(Statement subStatement : ((ForEachStmt) statement).getBody().asBlockStmt().getStatements()){
                                    synFeat = recursivelyCollectSynFeatFromStatement(subStatement, synFeat);
                                }
                            } else if (((ForEachStmt) statement).getBody().isExpressionStmt()){
                                synFeat.add(((ForEachStmt) statement).getBody().asExpressionStmt().getMetaModel().toString());
                            }
                        } else if (statement instanceof WhileStmt){
                            synFeat.add("WhileStmt");
                            synFeat.add(((WhileStmt) statement).getCondition().getMetaModel().toString());
                            if (((WhileStmt) statement).getBody().isBlockStmt()){
                                for(Statement subStatement : ((WhileStmt) statement).getBody().asBlockStmt().getStatements()){
                                    synFeat = recursivelyCollectSynFeatFromStatement(subStatement, synFeat);
                                }
                            } else if (((WhileStmt) statement).getBody().isBreakStmt()){
                                synFeat.add(statement.getMetaModel().toString());
                            }
                        } else if (statement instanceof DoStmt){
                            synFeat.add("DoStmt");
                            if (((DoStmt) statement).getBody().isBlockStmt()){
                                for(Statement subStatement : ((DoStmt) statement).getBody().asBlockStmt().getStatements()){
                                    synFeat = recursivelyCollectSynFeatFromStatement(subStatement, synFeat);
                                }
                            } else if (((DoStmt) statement).getBody().isBreakStmt()){
                                synFeat.add(statement.getMetaModel().toString());
                            }
                            synFeat.add(((DoStmt) statement).getCondition().getMetaModel().toString());
                        } else{
                            synFeat = collectSynFeatFromStatement(statement, synFeat);
                        }
                        return synFeat;
                    }
                    private List<String> recursivelyCollectSynFeatFromIFStatement(IfStmt statement, List<String> synFeat){
                        //Condition
                        synFeat.add(((IfStmt) statement).getCondition().getMetaModel().toString());
                        //If Statement
                        if (((IfStmt) statement).getThenStmt().isBlockStmt()){
                            for (Statement subStatement : ((IfStmt) statement).getThenStmt().asBlockStmt().getStatements()){
                                synFeat = recursivelyCollectSynFeatFromStatement(subStatement, synFeat);
                            }
                        } else if (((IfStmt) statement).getThenStmt().isBreakStmt()){
                            synFeat.add(statement.getThenStmt().getMetaModel().toString());
                        }
                        //Else Statement
                        if (((IfStmt) statement).getElseStmt().isPresent()){
                            Statement elseStatement = ((IfStmt) statement).getElseStmt().get();
                            if(elseStatement.isIfStmt()){
                                synFeat = recursivelyCollectSynFeatFromStatement(elseStatement,synFeat);
                            } else if(elseStatement.isBlockStmt()){
                                for (Statement subStatement : ((IfStmt) statement).getElseStmt().get().asBlockStmt().getStatements()) {
                                    synFeat = recursivelyCollectSynFeatFromStatement(subStatement, synFeat);
                                }
                            }
                        }
                        return synFeat;
                    }
                    private List<String> extractSemanticFeatures(String block) {
                        List<String> semanticFeatures = new ArrayList<>();

                        String[] lineArray = block.split("\n");

                        for (String line : lineArray){
                            if (!line.toLowerCase().contains("log.")){
                                String[] wordArray = line.replaceAll("[^a-zA-Z]+", " ").split("\\s+");
                                for (String word: wordArray){
                                    if (!word.isEmpty() && !word.equalsIgnoreCase("log") && !SourceVersion.isKeyword(word)) {
                                        semanticFeatures.add(word);
                                    }
                                }
                            }
                        }
                        return semanticFeatures;
                    }
                    private String getStatementType(Statement statement){
                        if(statement.isAssertStmt()) return "AssertStmt";
                        if(statement.isBlockStmt()) return "BlockStmt";
                        if(statement.isBreakStmt()) return "BreakStmt";
                        if(statement.isContinueStmt()) return "ContinueStmt";
                        if(statement.isDoStmt()) return "DoStmt";
                        if(statement.isExplicitConstructorInvocationStmt()) return "ExplicitConstructorInvocationStmt";
                        if(statement.isForEachStmt()) return "ForEachStmt";
                        if(statement.isForStmt()) return "ForStmt";
                        if(statement.isIfStmt()) return "IfStmt";
                        if(statement.isLocalClassDeclarationStmt()) return "LocalClassDeclarationStmt";
                        if(statement.isLabeledStmt()) return "LabeledStmt";
                        if(statement.isReturnStmt()) return "ReturnStmt";
                        if(statement.isSwitchStmt()) return "SwitchStmt";
                        if(statement.isSynchronizedStmt()) return "SynchronizedStmt";
                        if(statement.isThrowStmt()) return "ThrowStmt";
                        if(statement.isTryStmt()) return "TryStmt";
                        if(statement.isWhileStmt()) return "WhileStmt";
                        if(statement.isEmptyStmt()) return "EmptyStmt";
                        if(statement.isYieldStmt()) return "YieldStmt";
                        if(statement.isExpressionStmt()) return "ExpressionStmt";
                        else return "UnparsableStmt";
                    }

                }, null);

                List<MyBlock> blockSet = new ArrayList<>();
                for (MyBlock block : blocks){
                    if (block.semanticFeatures.size() !=0 && block.syntacticFeatures.size() !=0 ){
                        blockSet.add(block);
                    }
                }

                for (MyBlock block : blockSet){
                    String[] row = {file.split(projectPath)[1], block.type, Arrays.toString(block.syntacticFeatures.toArray()), Arrays.toString(block.semanticFeatures.toArray()), Double.toString(block.logDensity)};
                    writer.writeNext(row);
                }

            } catch (Exception e){
                if (e.getMessage().equals("Parsing failed")) System.out.println("WARNING: Failed to parse" + file);
                else System.out.println(e.getMessage());
            }
        }
        writer.flush();
        writer.close();
    }
}
