output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = aws_eks_cluster.cluster.name
}

output "eks_cluster_endpoint" {
  description = "API endpoint of the EKS cluster"
  value       = aws_eks_cluster.cluster.endpoint
}

output "eks_cluster_certificate_authority" {
  description = "Certificate authority data for the cluster"
  value       = aws_eks_cluster.cluster.certificate_authority[0].data
}

output "eks_cluster_security_group" {
  description = "Security group of the EKS control plane"
  value       = aws_security_group.cluster_sg.id
}

output "eks_node_security_group" {
  description = "Security group of the EKS nodes"
  value       = aws_security_group.node_sg.id
}

output "eks_node_group_name" {
  description = "Name of the EKS node group"
  value       = aws_eks_node_group.node1.node_group_name
}

output "eks_node_group_instance_types" {
  description = "Instance types of the node group"
  value       = aws_eks_node_group.node1.instance_types
}

output "eks_node_group_scaling_config" {
  description = "Scaling configuration of the node group"
  value = {
    min_size     = aws_eks_node_group.node1.scaling_config[0].min_size
    max_size     = aws_eks_node_group.node1.scaling_config[0].max_size
    desired_size = aws_eks_node_group.node1.scaling_config[0].desired_size
  }
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group for EKS cluster"
  value       = aws_cloudwatch_log_group.eks_log_group.name
}

output "eks_addons" {
  description = "Installed EKS addons"
  value = {
    cni        = aws_eks_addon.cni.addon_name
    coredns    = aws_eks_addon.coredns.addon_name
    kube_proxy = aws_eks_addon.kube-proxy.addon_name
  }
}

output "oidc_url" {
  value = aws_eks_cluster.cluster.identity[0].oidc[0].issuer  
}